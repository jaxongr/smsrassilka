package com.smsgateway.app

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.smsgateway.app.services.SmsService
import com.smsgateway.app.services.CallService
import com.smsgateway.app.services.SimManagerService
import com.smsgateway.app.services.GatewayForegroundService

class MainActivity : FlutterActivity() {

    private val SMS_CHANNEL = "com.smsgateway/sms"
    private val CALL_CHANNEL = "com.smsgateway/call"
    private val SIM_CHANNEL = "com.smsgateway/sim"
    private val PERM_CHANNEL = "com.smsgateway/permissions"

    private lateinit var smsService: SmsService
    private lateinit var callService: CallService
    private lateinit var simManagerService: SimManagerService

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        smsService = SmsService(this)
        callService = CallService(this)
        simManagerService = SimManagerService(this)

        // SMS Method Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SMS_CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "sendSms" -> {
                        val phoneNumber = call.argument<String>("phoneNumber") ?: ""
                        val message = call.argument<String>("message") ?: ""
                        val simSlot = call.argument<Int>("simSlot") ?: 0

                        smsService.sendSms(phoneNumber, message, simSlot) { success, error ->
                            runOnUiThread {
                                val response = HashMap<String, Any?>()
                                response["success"] = success
                                response["error"] = error
                                result.success(response)
                            }
                        }
                    }
                    else -> result.notImplemented()
                }
            }

        // Call Method Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CALL_CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "makeCall" -> {
                        val phoneNumber = call.argument<String>("phoneNumber") ?: ""
                        val voiceFileUrl = call.argument<String>("voiceFileUrl")
                        val simSlot = call.argument<Int>("simSlot") ?: 0
                        val maxDurationSec = call.argument<Int>("maxDurationSec") ?: 60

                        var resultSent = false
                        callService.makeCall(
                            phoneNumber, voiceFileUrl, simSlot, maxDurationSec
                        ) { success, error, duration, answered ->
                            if (!resultSent) {
                                resultSent = true
                                runOnUiThread {
                                    val response = HashMap<String, Any?>()
                                    response["success"] = success
                                    response["error"] = error
                                    response["duration"] = duration
                                    response["answered"] = answered
                                    try {
                                        result.success(response)
                                    } catch (_: Exception) {}
                                }
                            }
                        }
                    }
                    else -> result.notImplemented()
                }
            }

        // SIM Method Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, SIM_CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "getSimCards" -> {
                        val simCards = simManagerService.getSimCards()
                        result.success(simCards)
                    }
                    else -> result.notImplemented()
                }
            }

        // Permissions Method Channel
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, PERM_CHANNEL)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "requestBatteryOptimization" -> {
                        requestBatteryOptimization()
                        result.success(true)
                    }
                    else -> result.notImplemented()
                }
            }

        // Auto-request battery optimization on startup
        requestBatteryOptimization()

        // Start foreground service - keeps app alive when screen is off
        GatewayForegroundService.start(this)
    }

    private fun requestBatteryOptimization() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val pm = getSystemService(POWER_SERVICE) as PowerManager
                if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:$packageName")
                    }
                    startActivity(intent)
                }
            }
        } catch (_: Exception) {}
    }
}
