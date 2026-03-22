package com.smsgateway.app.services

import android.app.Activity
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.telephony.SmsManager
import android.telephony.SubscriptionManager
import android.util.Log

class SmsService(private val activity: Activity) {

    companion object {
        private const val TAG = "SmsService"
        private const val SMS_SENT_ACTION = "com.smsgateway.SMS_SENT"
        private const val SMS_DELIVERED_ACTION = "com.smsgateway.SMS_DELIVERED"
    }

    fun sendSms(
        phoneNumber: String,
        message: String,
        simSlot: Int,
        callback: (success: Boolean, error: String?) -> Unit
    ) {
        try {
            val smsManager = getSmsManagerForSlot(simSlot)

            if (smsManager == null) {
                callback(false, "SIM slot $simSlot topilmadi")
                return
            }

            val sentIntent = PendingIntent.getBroadcast(
                activity,
                0,
                Intent(SMS_SENT_ACTION),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            val deliveryIntent = PendingIntent.getBroadcast(
                activity,
                0,
                Intent(SMS_DELIVERED_ACTION),
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )

            // Register sent receiver
            val sentReceiver = object : BroadcastReceiver() {
                override fun onReceive(context: Context?, intent: Intent?) {
                    try {
                        activity.unregisterReceiver(this)
                    } catch (_: Exception) {}

                    when (resultCode) {
                        Activity.RESULT_OK -> {
                            Log.d(TAG, "SMS sent successfully to $phoneNumber")
                            callback(true, null)
                        }
                        SmsManager.RESULT_ERROR_GENERIC_FAILURE -> {
                            callback(false, "Umumiy xatolik")
                        }
                        SmsManager.RESULT_ERROR_NO_SERVICE -> {
                            callback(false, "Xizmat mavjud emas")
                        }
                        SmsManager.RESULT_ERROR_NULL_PDU -> {
                            callback(false, "Null PDU")
                        }
                        SmsManager.RESULT_ERROR_RADIO_OFF -> {
                            callback(false, "Radio o'chirilgan")
                        }
                        else -> {
                            callback(false, "Noma'lum xatolik: $resultCode")
                        }
                    }
                }
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                activity.registerReceiver(
                    sentReceiver,
                    IntentFilter(SMS_SENT_ACTION),
                    Context.RECEIVER_NOT_EXPORTED
                )
            } else {
                activity.registerReceiver(sentReceiver, IntentFilter(SMS_SENT_ACTION))
            }

            // Check if message needs to be split into parts
            val parts = smsManager.divideMessage(message)
            if (parts.size > 1) {
                val sentIntents = ArrayList<PendingIntent>()
                val deliveryIntents = ArrayList<PendingIntent>()
                for (i in parts.indices) {
                    sentIntents.add(sentIntent)
                    deliveryIntents.add(deliveryIntent)
                }
                smsManager.sendMultipartTextMessage(
                    phoneNumber, null, parts, sentIntents, deliveryIntents
                )
            } else {
                smsManager.sendTextMessage(
                    phoneNumber, null, message, sentIntent, deliveryIntent
                )
            }

            Log.d(TAG, "SMS sending initiated to $phoneNumber via SIM slot $simSlot")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to send SMS", e)
            callback(false, e.message ?: "Noma'lum xatolik")
        }
    }

    @Suppress("DEPRECATION")
    private fun getSmsManagerForSlot(simSlot: Int): SmsManager? {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val subscriptionManager =
                    activity.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
                val subscriptionInfoList = subscriptionManager.activeSubscriptionInfoList
                if (subscriptionInfoList != null && subscriptionInfoList.size > simSlot) {
                    val subscriptionId = subscriptionInfoList[simSlot].subscriptionId
                    SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
                } else {
                    activity.getSystemService(SmsManager::class.java)
                }
            } else {
                val subscriptionManager =
                    activity.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager
                val subscriptionInfoList = subscriptionManager.activeSubscriptionInfoList
                if (subscriptionInfoList != null && subscriptionInfoList.size > simSlot) {
                    val subscriptionId = subscriptionInfoList[simSlot].subscriptionId
                    SmsManager.getSmsManagerForSubscriptionId(subscriptionId)
                } else {
                    SmsManager.getDefault()
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied for SIM access", e)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                activity.getSystemService(SmsManager::class.java)
            } else {
                SmsManager.getDefault()
            }
        }
    }
}
