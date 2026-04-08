import ExpoModulesCore
import CoreMotion

public class ActivityRecognitionModule: Module {
  private let activityManager = CMMotionActivityManager()
  private var isMonitoring = false

  public func definition() -> ModuleDefinition {
    Name("ActivityRecognition")

    Events("onActivityChange")

    AsyncFunction("isAvailable") { () -> Bool in
      return CMMotionActivityManager.isActivityAvailable()
    }

    AsyncFunction("startMonitoring") { () in
      guard CMMotionActivityManager.isActivityAvailable() else {
        throw MotionNotAvailableException()
      }

      guard !self.isMonitoring else { return }
      self.isMonitoring = true

      self.activityManager.startActivityUpdates(to: OperationQueue.main) { [weak self] activity in
        guard let self = self, let activity = activity else { return }

        let activityType = self.mapActivityType(activity)
        let confidence = self.mapConfidence(activity.confidence)

        self.sendEvent("onActivityChange", [
          "type": activityType,
          "confidence": confidence,
          "timestamp": activity.startDate.timeIntervalSince1970 * 1000
        ])
      }
    }

    AsyncFunction("stopMonitoring") { () in
      self.activityManager.stopActivityUpdates()
      self.isMonitoring = false
    }
  }

  private func mapActivityType(_ activity: CMMotionActivity) -> String {
    if activity.running {
      return "running"
    } else if activity.walking {
      return "walking"
    } else if activity.cycling {
      return "cycling"
    } else if activity.automotive {
      return "automotive"
    } else if activity.stationary {
      return "stationary"
    }
    return "unknown"
  }

  private func mapConfidence(_ confidence: CMMotionActivityConfidence) -> String {
    switch confidence {
    case .low:
      return "low"
    case .medium:
      return "medium"
    case .high:
      return "high"
    @unknown default:
      return "low"
    }
  }
}

internal class MotionNotAvailableException: Exception {
  override var reason: String {
    "Motion activity recognition is not available on this device"
  }
}
