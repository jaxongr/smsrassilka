package com.smsgateway.app.services

import android.app.Activity
import android.content.Context
import android.content.Intent
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

    fun makeCall(
        phoneNumber: String,
        voiceFilePath: String?,
        simSlot: Int,
        maxDurationSec: Int,
        callback: (success: Boolean, error: String?, duration: Int?, answered: Boolean?) -> Unit
    ) {
        var done = false
        fun finish(success: Boolean, error: String?, duration: Int?, answered: Boolean?) {
            if (!done) {
                done = true
                handler.removeCallbacksAndMessages(null)
                stopMedia()
                callback(success, error, duration, answered)
            }
        }

        try {
            Log.d(TAG, "CALL $phoneNumber voice=$voiceFilePath")

            val tm = activity.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            var answered = false
            var startTime = 0L
            var dialing = false

            val onState = fun(state: Int) {
                Log.d(TAG, "state=$state answered=$answered dialing=$dialing")
                when (state) {
                    TelephonyManager.CALL_STATE_OFFHOOK -> {
                        if (!answered) {
                            answered = true
                            startTime = System.currentTimeMillis()
                            // Play voice after 2 seconds
                            handler.postDelayed({
                                playViaSpeaker(voiceFilePath) {
                                    // Voice done - end call
                                    Log.d(TAG, "Voice finished, ending call")
                                    handler.postDelayed({ endCall() }, 500)
                                }
                            }, 2000)
                        }
                    }
                    TelephonyManager.CALL_STATE_IDLE -> {
                        if (dialing) {
                            val dur = if (startTime > 0) ((System.currentTimeMillis() - startTime) / 1000).toInt() else 0
                            Log.d(TAG, "ENDED dur=$dur answered=$answered")
                            finish(answered, null, dur, answered)
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

            dialing = true
            activity.startActivity(Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$phoneNumber")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            })

            // 25s no answer timeout
            handler.postDelayed({
                if (!answered) {
                    Log.d(TAG, "NO ANSWER")
                    endCall()
                    finish(false, "Javob bermadi", 0, false)
                }
            }, 25000)

        } catch (e: Exception) {
            Log.e(TAG, "ERR: ${e.message}")
            finish(false, e.message, null, null)
        }
    }

    private fun playViaSpeaker(path: String?, onDone: () -> Unit) {
        if (path == null || !File(path).exists()) {
            Log.w(TAG, "No voice file: $path")
            onDone()
            return
        }

        try {
            val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager

            // Enable speaker
            am.isSpeakerphoneOn = true
            am.mode = AudioManager.MODE_IN_CALL

            // Max volume
            val maxCall = am.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL)
            am.setStreamVolume(AudioManager.STREAM_VOICE_CALL, maxCall, 0)
            val maxMusic = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            am.setStreamVolume(AudioManager.STREAM_MUSIC, maxMusic, 0)

            Log.d(TAG, "Speaker ON, vol=$maxCall/$maxMusic")

            mediaPlayer?.release()
            @Suppress("DEPRECATION")
            mediaPlayer = MediaPlayer().apply {
                // Use deprecated but WORKING method for older Samsung phones
                setAudioStreamType(AudioManager.STREAM_MUSIC)
                setDataSource(path)
                setVolume(1.0f, 1.0f)
                setOnCompletionListener { onDone() }
                setOnErrorListener { _, w, e ->
                    Log.e(TAG, "Player err $w/$e")
                    onDone()
                    true
                }
                prepare()
                start()
                Log.d(TAG, "PLAYING ${File(path).length()} bytes")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Play err: ${e.message}")
            onDone()
        }
    }

    private fun stopMedia() {
        try {
            mediaPlayer?.release()
            mediaPlayer = null
            val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            am.isSpeakerphoneOn = false
            am.mode = AudioManager.MODE_NORMAL
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
        } catch (e: Exception) {
            Log.e(TAG, "endCall: ${e.message}")
        }
    }
}
