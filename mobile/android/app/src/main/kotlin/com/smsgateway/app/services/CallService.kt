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

    fun makeCall(
        phoneNumber: String,
        voiceFilePath: String?,
        simSlot: Int,
        maxDurationSec: Int,
        callback: (success: Boolean, error: String?, duration: Int?, answered: Boolean?) -> Unit
    ) {
        var callbackDone = false
        fun safeCallback(success: Boolean, error: String?, duration: Int?, answered: Boolean?) {
            if (!callbackDone) {
                callbackDone = true
                handler.removeCallbacksAndMessages(null)
                callback(success, error, duration, answered)
            }
        }

        try {
            Log.d(TAG, "=== CALL START: $phoneNumber, voice: $voiceFilePath ===")

            val tm = activity.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            var callAnswered = false
            var callStartTime = 0L

            // Listen for call state changes
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                tm.registerTelephonyCallback(activity.mainExecutor,
                    object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                        override fun onCallStateChanged(state: Int) {
                            Log.d(TAG, "State: $state")
                            when (state) {
                                TelephonyManager.CALL_STATE_OFFHOOK -> {
                                    if (!callAnswered) {
                                        callAnswered = true
                                        callStartTime = System.currentTimeMillis()
                                        Log.d(TAG, "ANSWERED")
                                        // Play voice after 2 seconds
                                        handler.postDelayed({
                                            tryPlayVoice(voiceFilePath)
                                        }, 2000)
                                    }
                                }
                                TelephonyManager.CALL_STATE_IDLE -> {
                                    if (callAnswered) {
                                        val dur = ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                                        Log.d(TAG, "ENDED after ${dur}s")
                                        stopVoice()
                                        safeCallback(true, null, dur, true)
                                    }
                                }
                            }
                        }
                    })
            } else {
                @Suppress("DEPRECATION")
                tm.listen(object : PhoneStateListener() {
                    @Deprecated("Deprecated in Java")
                    override fun onCallStateChanged(state: Int, number: String?) {
                        Log.d(TAG, "State: $state")
                        when (state) {
                            TelephonyManager.CALL_STATE_OFFHOOK -> {
                                if (!callAnswered) {
                                    callAnswered = true
                                    callStartTime = System.currentTimeMillis()
                                    Log.d(TAG, "ANSWERED")
                                    handler.postDelayed({
                                        tryPlayVoice(voiceFilePath)
                                    }, 2000)
                                }
                            }
                            TelephonyManager.CALL_STATE_IDLE -> {
                                if (callAnswered) {
                                    val dur = ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                                    Log.d(TAG, "ENDED after ${dur}s")
                                    stopVoice()
                                    safeCallback(true, null, dur, true)
                                }
                            }
                        }
                    }
                }, PhoneStateListener.LISTEN_CALL_STATE)
            }

            // Start call
            val intent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$phoneNumber")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            activity.startActivity(intent)
            Log.d(TAG, "Call started")

            // No answer timeout - 25 seconds
            handler.postDelayed({
                if (!callAnswered) {
                    Log.d(TAG, "NO ANSWER - timeout")
                    endCall()
                    safeCallback(false, "Javob bermadi", 0, false)
                }
            }, 25000)

        } catch (e: Exception) {
            Log.e(TAG, "ERROR: ${e.message}")
            safeCallback(false, e.message, null, null)
        }
    }

    private var mediaPlayer: MediaPlayer? = null

    private fun tryPlayVoice(path: String?) {
        if (path == null) return
        val file = File(path)
        if (!file.exists()) {
            Log.e(TAG, "Voice file not found: $path")
            return
        }
        try {
            val am = activity.getSystemService(Context.AUDIO_SERVICE) as AudioManager
            am.mode = AudioManager.MODE_IN_CALL
            am.isSpeakerphoneOn = true
            val max = am.getStreamMaxVolume(AudioManager.STREAM_VOICE_CALL)
            am.setStreamVolume(AudioManager.STREAM_VOICE_CALL, max, 0)

            mediaPlayer = MediaPlayer().apply {
                setDataSource(path)
                setOnCompletionListener {
                    Log.d(TAG, "Voice done, ending call")
                    endCall()
                }
                prepare()
                start()
            }
            Log.d(TAG, "Voice playing: $path")
        } catch (e: Exception) {
            Log.e(TAG, "Voice play error: ${e.message}")
        }
    }

    private fun stopVoice() {
        try {
            mediaPlayer?.stop()
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
            Log.e(TAG, "endCall error: ${e.message}")
        }
    }
}
