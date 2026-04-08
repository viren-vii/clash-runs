package expo.modules.mymodule

import android.Manifest
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.core.content.ContextCompat
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.ActivityTransitionRequest
import com.google.android.gms.location.ActivityTransitionResult
import com.google.android.gms.location.DetectedActivity
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ActivityRecognitionModule : Module() {
  private var isMonitoring = false

  companion object {
    const val ACTION_ACTIVITY_TRANSITION = "com.clashruns.ACTIVITY_TRANSITION"
    var moduleInstance: ActivityRecognitionModule? = null
  }

  override fun definition() = ModuleDefinition {
    Name("ActivityRecognition")

    Events("onActivityChange")

    AsyncFunction("isAvailable") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        ContextCompat.checkSelfPermission(
          context,
          Manifest.permission.ACTIVITY_RECOGNITION
        ) == PackageManager.PERMISSION_GRANTED
      } else {
        true
      }
      hasPermission
    }

    AsyncFunction("startMonitoring") {
      val context = appContext.reactContext
        ?: throw CodedException("ERR_NO_CONTEXT", "React context is not available", null)

      if (isMonitoring) return@AsyncFunction

      moduleInstance = this@ActivityRecognitionModule

      val transitions = listOf(
        DetectedActivity.STILL,
        DetectedActivity.WALKING,
        DetectedActivity.RUNNING,
        DetectedActivity.ON_BICYCLE,
        DetectedActivity.IN_VEHICLE
      ).flatMap { activityType ->
        listOf(
          ActivityTransition.Builder()
            .setActivityType(activityType)
            .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
            .build(),
          ActivityTransition.Builder()
            .setActivityType(activityType)
            .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
            .build()
        )
      }

      val request = ActivityTransitionRequest(transitions)

      val intent = Intent(ACTION_ACTIVITY_TRANSITION)
      intent.setPackage(context.packageName)

      val pendingIntent = PendingIntent.getBroadcast(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
      )

      val filter = IntentFilter(ACTION_ACTIVITY_TRANSITION)
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        context.registerReceiver(
          activityTransitionReceiver,
          filter,
          Context.RECEIVER_NOT_EXPORTED
        )
      } else {
        context.registerReceiver(activityTransitionReceiver, filter)
      }

      ActivityRecognition.getClient(context)
        .requestActivityTransitionUpdates(request, pendingIntent)
        .addOnSuccessListener {
          isMonitoring = true
        }
        .addOnFailureListener { e ->
          throw CodedException("ERR_ACTIVITY_RECOGNITION", "Failed to start: ${e.message}", e)
        }
    }

    AsyncFunction("stopMonitoring") {
      val context = appContext.reactContext ?: return@AsyncFunction

      if (!isMonitoring) return@AsyncFunction

      try {
        context.unregisterReceiver(activityTransitionReceiver)
      } catch (_: IllegalArgumentException) {}

      val intent = Intent(ACTION_ACTIVITY_TRANSITION)
      intent.setPackage(context.packageName)
      val pendingIntent = PendingIntent.getBroadcast(
        context,
        0,
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
      )

      ActivityRecognition.getClient(context)
        .removeActivityTransitionUpdates(pendingIntent)

      isMonitoring = false
      moduleInstance = null
    }
  }

  fun sendActivityEvent(type: String, confidence: String, timestamp: Long) {
    sendEvent("onActivityChange", mapOf(
      "type" to type,
      "confidence" to confidence,
      "timestamp" to timestamp
    ))
  }

  private val activityTransitionReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent == null) return
      if (ActivityTransitionResult.hasResult(intent)) {
        val result = ActivityTransitionResult.extractResult(intent) ?: return
        for (event in result.transitionEvents) {
          if (event.transitionType == ActivityTransition.ACTIVITY_TRANSITION_ENTER) {
            val type = mapActivityType(event.activityType)
            moduleInstance?.sendActivityEvent(
              type,
              "high",
              System.currentTimeMillis()
            )
          }
        }
      }
    }
  }

  private fun mapActivityType(activityType: Int): String {
    return when (activityType) {
      DetectedActivity.STILL -> "stationary"
      DetectedActivity.WALKING -> "walking"
      DetectedActivity.RUNNING -> "running"
      DetectedActivity.ON_BICYCLE -> "cycling"
      DetectedActivity.IN_VEHICLE -> "automotive"
      else -> "unknown"
    }
  }
}
