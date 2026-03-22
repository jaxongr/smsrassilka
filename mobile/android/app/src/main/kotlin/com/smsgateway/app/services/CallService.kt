package com.smsgateway.app.services

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
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

    fun makeCall(
        phoneNumber: String,
        voiceFileUrl: String?,
        simSlot: Int,
        maxDurationSec: Int,
        callback: (success: Boolean, error: String?, duration: Int?, answered: Boolean?) -> Unit
    ) {
        try {
            val telephonyManager =
                activity.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            var callAnswered = false
            var callEnded = false

            // Set up call state listener
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                telephonyManager.registerTelephonyCallback(
                    activity.mainExecutor,
                    object : TelephonyCallback(), TelephonyCallback.CallStateListener {
                        override fun onCallStateChanged(state: Int) {
                            handleCallState(
                                state,
                                voiceFileUrl,
                                maxDurationSec,
                                callAnswered = { callAnswered = true },
                                callEnded = {
                                    if (!callEnded) {
                                        callEnded = true
                                        val duration = if (callStartTime > 0) {
                                            ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                                        } else 0
                                        cleanupCall()
                                        callback(true, null, duration, callAnswered)
                                    }
                                }
                            )
                        }
                    }
                )
            } else {
                @Suppress("DEPRECATION")
                telephonyManager.listen(
                    object : PhoneStateListener() {
                        @Deprecated("Deprecated in Java")
                        override fun onCallStateChanged(state: Int, incomingNumber: String?) {
                            handleCallState(
                                state,
                                voiceFileUrl,
                                maxDurationSec,
                                callAnswered = { callAnswered = true },
                                callEnded = {
                                    if (!callEnded) {
                                        callEnded = true
                                        val duration = if (callStartTime > 0) {
                                            ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                                        } else 0
                                        cleanupCall()
                                        callback(true, null, duration, callAnswered)
                                    }
                                }
                            )
                        }
                    },
                    PhoneStateListener.LISTEN_CALL_STATE
                )
            }

            // Initiate the call
            val callIntent = Intent(Intent.ACTION_CALL).apply {
                data = Uri.parse("tel:$phoneNumber")

                // Set SIM slot for dual SIM
                try {
                    val subscriptionManager =
                        activity.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
                    val subscriptionInfoList = subscriptionManager.activeSubscriptionInfoList
                    if (subscriptionInfoList != null && subscriptionInfoList.size > simSlot) {
                        val subscriptionId = subscriptionInfoList[simSlot].subscriptionId
                        putExtra("android.telecom.extra.PHONE_ACCOUNT_HANDLE", subscriptionId)
                    }
                } catch (e: SecurityException) {
                    Log.w(TAG, "Cannot access subscription info for SIM selection", e)
                }
            }

            activity.startActivity(callIntent)

            // Set max duration timeout
            handler.postDelayed({
                if (!callEnded) {
                    callEnded = true
                    endCall()
                    val duration = if (callStartTime > 0) {
                        ((System.currentTimeMillis() - callStartTime) / 1000).toInt()
                    } else 0
                    cleanupCall()
                    callback(true, null, duration, callAnswered)
                }
            }, (maxDurationSec * 1000).toLong())

            Log.d(TAG, "Call initiated to $phoneNumber via SIM slot $simSlot")
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied for making call", e)
            callback(false, "Qo'ng'iroq ruxsati berilmagan", null, null)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to make call", e)
            callback(false, e.message ?: "Noma'lum xatolik", null, null)
        }
    }

    private fun handleCallState(
        state: Int,
        voiceFileUrl: String?,
        maxDurationSec: Int,
        callAnswered: () -> Unit,
        callEnded: () -> Unit
    ) {
        when (state) {
            TelephonyManager.CALL_STATE_OFFHOOK -> {
                // Call answered
                callStartTime = System.currentTimeMillis()
                callAnswered()

                // Play voice file if available
                if (voiceFileUrl != null) {
                    playVoiceFile(voiceFileUrl)
                }
            }
            TelephonyManager.CALL_STATE_IDLE -> {
                // Call ended
                if (callStartTime > 0) {
                    callEnded()
                }
            }
            TelephonyManager.CALL_STATE_RINGING -> {
                // Incoming call (not relevant for outgoing)
            }
        }
    }

    private fun playVoiceFile(voiceFileUrl: String) {
        try {
            mediaPlayer?.release()
            mediaPlayer = MediaPlayer().apply {
                // Check if it's a local file path
                val file = File(voiceFileUrl)
                if (file.exists()) {
                    setDataSource(voiceFileUrl)
                } else {
                    setDataSource(voiceFileUrl)
                }
                prepare()
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to play voice file", e)
        }
    }

    private fun endCall() {
        try {
            val telephonyManager =
                activity.getSystemService(Context.TELEPHONY_SERVICE) as TelephonyManager
            val method = telephonyManager.javaClass.getMethod("endCall")
            method.invoke(telephonyManager)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to end call programmatically", e)
        }
    }

    private fun cleanupCall() {
        try {
            mediaPlayer?.stop()
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (_: Exception) {}
        callStartTime = 0
        handler.removeCallbacksAndMessages(null)
    }
}
