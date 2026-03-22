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
            var wasRinging = false

            // Set up call state listener
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                telephonyManager.registerTelephonyCallback(
                    activity.mainExecutor,
                    object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                        override fun onCallStateChanged(state: Int) {
                            when (state) {
                                TelephonyManager.CALL_STATE_RINGING -> {
                                    wasRinging = true
                                }
                                TelephonyManager.CALL_STATE_OFFHOOK -> {
                                    callStartTime = System.currentTimeMillis()
                                    callAnswered = true
                                    // Wait 1 second then play audio
                                    handler.postDelayed({
                                        playVoiceFile(voiceFilePath)
                                    }, 1000)
                                }
                                TelephonyManager.CALL_STATE_IDLE -> {
                                    if (callAnswered || wasRinging) {
                                        if (!callEnded) {
                                            callEnded = true
                                            val duration = if (callStartTime > 0)
                                                ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                                            else 0
                                            cleanupCall()
                                            callback(true, null, duration, callAnswered)
                                        }
                                    }
                                }
                            }
                        }
                    }
                )
            } else {
                @Suppress("DEPRECATION")
                telephonyManager.listen(
                    object : PhoneStateListener() {
                        @Deprecated("Deprecated in Java")
                        override fun onCallStateChanged(state: Int, incomingNumber: String?) {
                            when (state) {
                                TelephonyManager.CALL_STATE_RINGING -> {
                                    wasRinging = true
                                }
                                TelephonyManager.CALL_STATE_OFFHOOK -> {
                                    callStartTime = System.currentTimeMillis()
                                    callAnswered = true
                                    handler.postDelayed({
                                        playVoiceFile(voiceFilePath)
                                    }, 1000)
                                }
                                TelephonyManager.CALL_STATE_IDLE -> {
                                    if (callAnswered || wasRinging) {
                                        if (!callEnded) {
                                            callEnded = true
                                            val duration = if (callStartTime > 0)
                                                ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                                            else 0
                                            cleanupCall()
                                            callback(true, null, duration, callAnswered)
                                        }
                                    }
                                }
                            }
                        }
                    },
                    PhoneStateListener.LISTEN_CALL_STATE
                )
            }

            // Initiate the call
            val callIntent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$phoneNumber")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK

                try {
                    val subscriptionManager = activity.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
                    val subscriptionInfoList = subscriptionManager.activeSubscriptionInfoList
                    if (subscriptionInfoList != null && subscriptionInfoList.size > simSlot) {
                        val subscriptionId = subscriptionInfoList[simSlot].subscriptionId
                        putExtra("android.telecom.extra.PHONE_ACCOUNT_HANDLE", subscriptionId)
                    }
                } catch (e: SecurityException) {
                    Log.w(TAG, "Cannot access subscription info", e)
                }
            }

            activity.startActivity(callIntent)

            // Max duration timeout - end call and report
            handler.postDelayed({
                if (!callEnded) {
                    callEnded = true
                    endCall()
                    val duration = if (callStartTime > 0)
                        ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                    else 0
                    cleanupCall()
                    callback(true, null, duration, callAnswered)
                }
            }, (maxDurationSec * 1000).toLong())

            // Ringing timeout - if no answer in 20 seconds, end call
            handler.postDelayed({
                if (!callAnswered && !callEnded) {
                    callEnded = true
                    endCall()
                    cleanupCall()
                    callback(false, "Javob bermadi", 0, false)
                }
            }, 20000)

            Log.d(TAG, "Call initiated to $phoneNumber")
        } catch (e: SecurityException) {
            callback(false, "Qo'ng'iroq ruxsati yo'q", null, null)
        } catch (e: Exception) {
            callback(false, e.message ?: "Xatolik", null, null)
        }
    }

    private fun playVoiceFile(voiceFilePath: String?) {
        if (voiceFilePath == null) return

        try {
            // Enable speakerphone so the other party can hear
            audioManager?.mode = AudioManager.MODE_IN_CALL
            audioManager?.isSpeakerphoneOn = true

            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                        .build()
                )

                val file = File(voiceFilePath)
                if (file.exists()) {
                    setDataSource(voiceFilePath)
                    Log.d(TAG, "Playing local file: $voiceFilePath")
                } else {
                    setDataSource(voiceFilePath)
                    Log.d(TAG, "Playing URL: $voiceFilePath")
                }

                setOnCompletionListener {
                    Log.d(TAG, "Voice playback complete, ending call")
                    // Audio finished - end call after 1 second
                    handler.postDelayed({ endCall() }, 1000)
                }

                prepare()
                start()
                Log.d(TAG, "Voice playback started")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play voice: ${e.message}", e)
            // Even if audio fails, end call after 5 seconds
            handler.postDelayed({ endCall() }, 5000)
        }
    }

    private fun endCall() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                val telecomManager = activity.getSystemService(Context.TELECOM_SERVICE) as TelecomManager
                telecomManager.endCall()
            } else {
                val telephonyManager = activity.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
                val method = telephonyManager.javaClass.getMethod("endCall")
                method.invoke(telephonyManager)
            }
            Log.d(TAG, "Call ended programmatically")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to end call: ${e.message}")
        }
    }

    private fun cleanupCall() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
            audioManager?.isSpeakerphoneOn = false
            audioManager?.mode = AudioManager.MODE_NORMAL
        } catch (_: Exception) {}
        callStartTime = 0
        handler.removeCallbacksAndMessages(null)
    }
}
