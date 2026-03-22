package com.smsgateway.app

import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import com.smsgateway.app.services.SmsService
import com.smsgateway.app.services.CallService
import com.smsgateway.app.services.SimManagerService

class MainActivity : FlutterActivity() {

    private val SMS_CHANNEL = "com.smsgateway/sms"
    private val CALL_CHANNEL = "com.smsgateway/call"
    private val SIM_CHANNEL = "com.smsgateway/sim"

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

                        callService.makeCall(
                            phoneNumber, voiceFileUrl, simSlot, maxDurationSec
                        ) { success, error, duration, answered ->
                            runOnUiThread {
                                val response = HashMap<String, Any?>()
                                response["success"] = success
                                response["error"] = error
                                response["duration"] = duration
                                response["answered"] = answered
                                result.success(response)
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
    }
}
