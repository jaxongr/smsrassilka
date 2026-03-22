package com.smsgateway.app.services

import android.app.Activity
import android.content.Context
import android.os.Build
import android.telephony.SubscriptionManager
import android.util.Log

class SimManagerService(private val activity: Activity) {

    companion object {
        private const val TAG = "SimManagerService"
    }

    fun getSimCards(): List<Map<String, Any?>> {
        val simCards = mutableListOf<Map<String, Any?>>()

        try {
            val subscriptionManager =
                activity.getSystemService(Context.TELEPHONY_SUBSCRIPTION_SERVICE) as SubscriptionManager

            val subscriptionInfoList = subscriptionManager.activeSubscriptionInfoList

            if (subscriptionInfoList != null) {
                for (info in subscriptionInfoList) {
                    val simCard = HashMap<String, Any?>()
                    simCard["slotIndex"] = info.simSlotIndex
                    simCard["operatorName"] = info.carrierName?.toString() ?: "Noma'lum"
                    simCard["phoneNumber"] = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        try {
                            subscriptionManager.getPhoneNumber(info.subscriptionId)
                        } catch (e: Exception) {
                            info.number
                        }
                    } else {
                        info.number
                    }
                    simCard["smsCapable"] = true
                    simCard["callCapable"] = true
                    simCards.add(simCard)
                }
            }
        } catch (e: SecurityException) {
            Log.e(TAG, "Permission denied for reading SIM info", e)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to get SIM cards", e)
        }

        return simCards
    }
}
