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
import android.telephony.SubscriptionManager
import android.telephony.TelephonyCallback
import android.telephony.TelephonyManager
import android.util.Log
import java.io.File

class CallService(private val activity: Activity) {

    companion object {
        private const val TAG = "CallService"
    }

    private var mediaPlayer: MediaPlayer? = null
    private var callStartTime: Long = 0
    private var handler = Handler(Looper.getMainLooper())
    private var audioManager: AudioManager? = null
    private var originalVolume: Int = 0

    fun makeCall(
        phoneNumber: String,
        voiceFilePath: String?,
        simSlot: Int,
        maxDurationSec: Int,
        callback: (success: Boolean, error: String?, duration: Int?, answered: Boolean?) -> Unit
    ) {
        try {
            val telephonyManager = activity.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            audioManager = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            var callAnswered = false
            var callEnded = false
            var wasDialing = false

            Log.d(TAG, "Making call to $phoneNumber, voiceFile: $voiceFilePath")

            val stateCallback = fun(state: Int) {
                Log.d(TAG, "Call state: $state (IDLE=0, RINGING=1, OFFHOOK=2)")
                when (state) {
                    TelephonyManager.CALL_STATE_OFFHOOK -> {
                        if (!callAnswered) {
                            callStartTime = System.currentTimeMillis()
                            callAnswered = true
                            wasDialing = true
                            Log.d(TAG, "Call answered! Playing voice after 1.5s delay")

                            // Wait 1.5 seconds for call to stabilize, then play
                            handler.postDelayed({
                                playVoiceFile(voiceFilePath)
                            }, 1500)
                        }
                    }
                    TelephonyManager.CALL_STATE_IDLE -> {
                        if (wasDialing && !callEnded) {
                            callEnded = true
                            val duration = if (callStartTime > 0)
                                ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                            else 0
                            Log.d(TAG, "Call ended. Duration: ${duration}s, Answered: $callAnswered")
                            cleanupCall()
                            callback(callAnswered, null, duration, callAnswered)
                        }
                    }
                }
            }

            // Register call state listener
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                telephonyManager.registerTelephonyCallback(
                    activity.mainExecutor,
                    object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                        override fun onCallStateChanged(state: Int) {
                            stateCallback(state)
                        }
                    }
                )
            } else {
                @Suppress("DEPRECATION")
                telephonyManager.listen(
                    object : PhoneStateListener() {
                        @Deprecated("Deprecated in Java")
                        override fun onCallStateChanged(state: Int, incomingNumber: String?) {
                            stateCallback(state)
                        }
                    },
                    PhoneStateListener.LISTEN_CALL_STATE
                )
            }

            // Start the call
            val callIntent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$phoneNumber")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                try {
                    val sm = activity.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
                    val subs = sm.activeSubscriptionInfoList
                    if (subs != null && subs.size > simSlot) {
                        putExtra("android.telecom.extra.PHONE_ACCOUNT_HANDLE", subs[simSlot].subscriptionId)
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "SIM select failed: ${e.message}")
                }
            }

            wasDialing = true
            activity.startActivity(callIntent)
            Log.d(TAG, "Call intent started")

            // 20 second no-answer timeout
            handler.postDelayed({
                if (!callAnswered && !callEnded) {
                    callEnded = true
                    Log.d(TAG, "No answer timeout, ending call")
                    endCall()
                    cleanupCall()
                    callback(false, "Javob bermadi", 0, false)
                }
            }, 20000)

            // Max duration timeout
            handler.postDelayed({
                if (!callEnded) {
                    callEnded = true
                    Log.d(TAG, "Max duration reached, ending call")
                    endCall()
                    val duration = if (callStartTime > 0)
                        ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                    else 0
                    cleanupCall()
                    callback(true, null, duration, callAnswered)
                }
            }, ((maxDurationSec + 25) * 1000).toLong())

        } catch (e: SecurityException) {
            Log.e(TAG, "Permission error: ${e.message}")
            callback(false, "Ruxsat yo'q", null, null)
        } catch (e: Exception) {
            Log.e(TAG, "Call error: ${e.message}")
            callback(false, e.message ?: "Xatolik", null, null)
        }
    }

    private fun playVoiceFile(voiceFilePath: String?) {
        if (voiceFilePath == null) {
            Log.w(TAG, "No voice file to play")
            // No voice file - end call after 3 seconds
            handler.postDelayed({ endCall() }, 3000)
            return
        }

        val file = File(voiceFilePath)
        if (!file.exists()) {
            Log.e(TAG, "Voice file not found: $voiceFilePath")
            handler.postDelayed({ endCall() }, 3000)
            return
        }

        try {
            Log.d(TAG, "Setting up speaker and playing: $voiceFilePath (${file.length()} bytes)")

            // ENABLE SPEAKERPHONE - this is the key!
            audioManager?.let { am ->
                am.mode = AudioManager.MODE_IN_CALL
                am.isSpeakerphoneOn = true
                // Set volume to max
                originalVolume = am.getStreamVolume(AudioManager.STREAM_VOICE_CALL)
                val maxVol = am.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL)
                am.setStreamVolume(AudioManager.STREAM_VOICE_CALL, maxVol, 0)
                Log.d(TAG, "Speaker ON, volume: $maxVol")
            }

            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                // Use VOICE_CALL stream - goes through earpiece/speaker during call
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )

                setDataSource(voiceFilePath)

                setOnPreparedListener { mp ->
                    Log.d(TAG, "MediaPlayer prepared, starting playback")
                    mp.start()
                }

                setOnCompletionListener {
                    Log.d(TAG, "Voice playback complete, ending call in 1s")
                    handler.postDelayed({ endCall() }, 1000)
                }

                setOnErrorListener { _, what, extra ->
                    Log.e(TAG, "MediaPlayer error: what=$what, extra=$extra")
                    handler.postDelayed({ endCall() }, 1000)
                    true
                }

                prepareAsync()
            }

        } catch (e: Exception) {
            Log.e(TAG, "Play voice failed: ${e.message}", e)
            // Try alternative: play via MUSIC stream
            try {
                Log.d(TAG, "Trying MUSIC stream as fallback")
                audioManager?.isSpeakerphoneOn = true

                mediaPlayer?.release()
                mediaPlayer = MediaPlayer().apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_MEDIA)
                            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                            .build()
                    )
                    setDataSource(voiceFilePath)

                    setOnCompletionListener {
                        handler.postDelayed({ endCall() }, 1000)
                    }

                    prepare()
                    start()
                    Log.d(TAG, "Fallback MUSIC playback started")
                }
            } catch (e2: Exception) {
                Log.e(TAG, "Fallback play also failed: ${e2.message}")
                handler.postDelayed({ endCall() }, 3000)
            }
        }
    }

    private fun endCall() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val tm = activity.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
                tm.endCall()
            } else {
                val tm = activity.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                tm.javaClass.getMethod("endCall").invoke(tm)
            }
            Log.d(TAG, "Call ended")
        } catch (e: Exception) {
            Log.e(TAG, "endCall failed: ${e.message}")
        }
    }

    private fun cleanupCall() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
            audioManager?.let { am ->
                am.isSpeakerphoneOn = false
                am.mode = AudioManager.MODE_NORMAL
                am.setStreamVolume(AudioManager.STREAM_VOICE_CALL, originalVolume, 0)
            }
        } catch (_: Exception) {}
        callStartTime = 0
        handler.removeCallbacksAndMessages(null)
    }
}
