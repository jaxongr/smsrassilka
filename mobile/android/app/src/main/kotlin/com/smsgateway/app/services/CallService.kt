package com.smsgateway.app.services

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.telecom.TelecomManager
import android.telephony.PhoneStateListener
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import java.io.File

class CallService(private val activity: Activity) {

    companion object {
        private const val TAG = "CallService"
    }

    private var handler = Handler(Looper.getMainLooper())
    private var mediaPlayer: MediaPlayer? = null
    private var audioManager: AudioManager? = null
    private var savedMode: Int = AudioManager.MODE_NORMAL
    private var savedSpeaker: Boolean = false
    private var savedVolume: Int = 0

    fun makeCall(
        phoneNumber: String,
        voiceFilePath: String?,
        simSlot: Int,
        maxDurationSec: Int,
        callback: (success: Boolean, error: String?, duration: Int?, answered: Boolean?) -> Unit
    ) {
        var callbackDone = false
        fun done(success: Boolean, error: String?, duration: Int?, answered: Boolean?) {
            if (!callbackDone) {
                callbackDone = true
                handler.removeCallbacksAndMessages(null)
                stopVoice()
                callback(success, error, duration, answered)
            }
        }

        try {
            Log.d(TAG, "=== CALL: $phoneNumber, voice: $voiceFilePath ===")
            audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager

            val tm = activity.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            var answered = false
            var startTime = 0L
            var wasDialing = false

            val onState = fun(state: Int) {
                when (state) {
                    TelephonyManager.CALL_STATE_OFFHOOK -> {
                        if (!answered) {
                            answered = true
                            startTime = System.currentTimeMillis()
                            Log.d(TAG, "ANSWERED - playing voice in 1.5s")
                            handler.postDelayed({
                                playVoiceDirect(voiceFilePath)
                            }, 1500)
                        }
                    }
                    TelephonyManager.CALL_STATE_IDLE -> {
                        if (wasDialing) {
                            val dur = if (startTime > 0) ((System.currentTimeMillis() - startTime) / 1000).toInt() else 0
                            Log.d(TAG, "IDLE - dur: ${dur}s, answered: $answered")
                            done(answered, null, dur, answered)
                        }
                    }
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                tm.registerTelephonyCallback(activity.mainExecutor,
                    object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                        override fun onCallStateChanged(state: Int) { onState(state) }
                    })
            } else {
                @Suppress("DEPRECATION")
                tm.listen(object : PhoneStateListener() {
                    @Deprecated("Deprecated")
                    override fun onCallStateChanged(state: Int, n: String?) { onState(state) }
                }, PhoneStateListener.LISTEN_CALL_STATE)
            }

            // Start call
            wasDialing = true
            activity.startActivity(Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$phoneNumber")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            })

            // 25s no-answer timeout
            handler.postDelayed({
                if (!answered) {
                    Log.d(TAG, "NO ANSWER timeout")
                    endCall()
                    done(false, "Javob bermadi", 0, false)
                }
            }, 25000)

        } catch (e: Exception) {
            Log.e(TAG, "ERROR: ${e.message}")
            done(false, e.message, null, null)
        }
    }

    private fun playVoiceDirect(path: String?) {
        if (path == null) {
            Log.w(TAG, "No voice file")
            // No voice - end call after 3s
            handler.postDelayed({ endCall() }, 3000)
            return
        }

        val file = File(path)
        if (!file.exists()) {
            Log.e(TAG, "File not found: $path")
            handler.postDelayed({ endCall() }, 3000)
            return
        }

        try {
            val am = audioManager ?: return

            // Save current audio state
            savedMode = am.mode
            savedSpeaker = am.isSpeakerphoneOn
            savedVolume = am.getStreamVolume(AudioManager.STREAM_VOICE_CALL)

            // Set audio to communication mode - routes audio INTO the call
            am.mode = AudioManager.MODE_IN_COMMUNICATION

            // Set voice call volume to MAX
            val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL)
            am.setStreamVolume(AudioManager.STREAM_VOICE_CALL, maxVol, 0)

            // Also set music volume to max (fallback)
            val maxMusic = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            am.setStreamVolume(AudioManager.STREAM_MUSIC, maxMusic, 0)

            // DO NOT enable speakerphone - we want audio to go through earpiece into call
            am.isSpeakerphoneOn = false

            Log.d(TAG, "Audio: MODE_IN_COMMUNICATION, speaker OFF, vol MAX ($maxVol)")

            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                // CRITICAL: Use VOICE_COMMUNICATION - this sends audio INTO the phone call
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )

                setDataSource(path)

                setOnCompletionListener {
                    Log.d(TAG, "Voice done - ending call")
                    handler.postDelayed({ endCall() }, 500)
                }

                setOnErrorListener { _, what, extra ->
                    Log.e(TAG, "Player error: $what/$extra - trying speaker mode")
                    // Fallback: try with speakerphone
                    handler.post { playVoiceSpeaker(path) }
                    true
                }

                prepare()

                // Set player volume to MAX
                setVolume(1.0f, 1.0f)

                start()
                Log.d(TAG, "Playing voice (${file.length()} bytes) via VOICE_COMMUNICATION")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Direct play failed: ${e.message} - trying speaker")
            playVoiceSpeaker(path)
        }
    }

    // Fallback: play through speaker so microphone picks it up
    private fun playVoiceSpeaker(path: String) {
        try {
            val am = audioManager ?: return

            am.mode = AudioManager.MODE_IN_CALL
            am.isSpeakerphoneOn = true

            // Max all volumes
            am.setStreamVolume(AudioManager.STREAM_VOICE_CALL, am.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL), 0)
            am.setStreamVolume(AudioManager.STREAM_MUSIC, am.getStreamMaxVolume(AudioManager.STREAM_MUSIC), 0)
            am.setStreamVolume(AudioManager.STREAM_NOTIFICATION, am.getStreamMaxVolume(AudioManager.STREAM_NOTIFICATION), 0)

            Log.d(TAG, "SPEAKER mode: ON, all volumes MAX")

            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                // Use MEDIA usage for speaker playback
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_MEDIA)
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .build()
                )

                setDataSource(path)
                setVolume(1.0f, 1.0f)

                setOnCompletionListener {
                    Log.d(TAG, "Speaker voice done - ending call")
                    handler.postDelayed({ endCall() }, 500)
                }

                prepare()
                start()
                Log.d(TAG, "Playing via SPEAKER")
            }

        } catch (e: Exception) {
            Log.e(TAG, "Speaker play also failed: ${e.message}")
            handler.postDelayed({ endCall() }, 3000)
        }
    }

    private fun stopVoice() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
            audioManager?.let {
                it.mode = savedMode
                it.isSpeakerphoneOn = savedSpeaker
                it.setStreamVolume(AudioManager.STREAM_VOICE_CALL, savedVolume, 0)
            }
        } catch (_: Exception) {}
    }

    private fun endCall() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                (activity.getSystemService(Context.TELECOM_SERVICE) as TelecomManager).endCall()
            } else {
                val tm = activity.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                tm.javaClass.getMethod("endCall").invoke(tm)
            }
            Log.d(TAG, "Call ended")
        } catch (e: Exception) {
            Log.e(TAG, "endCall: ${e.message}")
        }
    }
}
