package com.smsgateway.app.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.smsgateway.app.services.GatewayForegroundService

class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED ||
            intent.action == "android.intent.action.QUICKBOOT_POWERON"
        ) {
            Log.d(TAG, "Device booted, checking if gateway should auto-start")

            val prefs = context.getSharedPreferences(
                "FlutterSharedPreferences", Context.MODE_PRIVATE
            )

            val isConfigured = prefs.getBoolean("flutter.is_configured", false)
            val gatewayActive = prefs.getBoolean("flutter.gateway_active", false)

            if (isConfigured && gatewayActive) {
                Log.d(TAG, "Auto-starting Gateway Foreground Service")
                GatewayForegroundService.start(context)
            } else {
                Log.d(TAG, "Gateway not configured or not active, skipping auto-start")
            }
        }
    }
}
