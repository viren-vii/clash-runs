import ActivityRecognitionModule from '@/modules/my-module';
import type {
  DetectedActivityType,
  ActivityConfidence,
} from '@/modules/my-module';
import {
  insertActivitySegment,
  updateActivitySegment,
  getOpenSegment,
} from '../database/segments-repository';
import type { SegmentActivityType } from '../types';

const DEBOUNCE_MS = 5000; // Require same activity for 5s before switching

let subscription: { remove: () => void } | null = null;
let currentActivity: SegmentActivityType = 'unknown';
let pendingActivity: SegmentActivityType | null = null;
let pendingTimestamp: number = 0;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let currentSegmentDbId: number | null = null;

type ActivityChangeCallback = (activity: SegmentActivityType) => void;
let onChangeCallback: ActivityChangeCallback | null = null;

function mapToSegmentActivity(type: DetectedActivityType): SegmentActivityType {
  switch (type) {
    case 'running':
      return 'running';
    case 'walking':
      return 'walking';
    case 'cycling':
      return 'cycling';
    case 'stationary':
      return 'stationary';
    default:
      return 'unknown';
  }
}

export function setActivityChangeCallback(
  callback: ActivityChangeCallback | null,
): void {
  onChangeCallback = callback;
}

export function getCurrentActivity(): SegmentActivityType {
  return currentActivity;
}

export async function startMonitoring(
  sessionId: string,
  segmentIndex: number,
): Promise<void> {
  const available = await ActivityRecognitionModule.isAvailable();
  if (!available) {
    console.warn('[ActivityMonitor] Activity recognition not available');
    return;
  }

  currentActivity = 'unknown';
  pendingActivity = null;

  // Create initial segment
  currentSegmentDbId = await insertActivitySegment({
    sessionId,
    segmentIndex,
    activityType: 'unknown',
    confidence: null,
    startTime: Date.now(),
    endTime: null,
    distance: 0,
  });

  // Subscribe to activity changes
  subscription = ActivityRecognitionModule.addListener(
    'onActivityChange',
    (event: { type: string; confidence: string; timestamp: number }) => {
      const mapped = mapToSegmentActivity(event.type as DetectedActivityType);
      handleActivityDetected(mapped, sessionId, segmentIndex);
    },
  );

  await ActivityRecognitionModule.startMonitoring();
}

function handleActivityDetected(
  detected: SegmentActivityType,
  sessionId: string,
  segmentIndex: number,
): void {
  if (detected === currentActivity) {
    // Same activity, cancel any pending change
    pendingActivity = null;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    return;
  }

  if (detected === pendingActivity) {
    // Already waiting to switch to this activity
    return;
  }

  // New different activity detected — start debounce
  pendingActivity = detected;
  pendingTimestamp = Date.now();

  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(async () => {
    if (pendingActivity === null) return;

    // Close current segment
    if (currentSegmentDbId !== null) {
      await updateActivitySegment(currentSegmentDbId, {
        endTime: pendingTimestamp,
      });
    }

    // Open new segment
    currentActivity = pendingActivity;
    currentSegmentDbId = await insertActivitySegment({
      sessionId,
      segmentIndex,
      activityType: currentActivity,
      confidence: 'medium',
      startTime: pendingTimestamp,
      endTime: null,
      distance: 0,
    });

    onChangeCallback?.(currentActivity);
    pendingActivity = null;
    debounceTimer = null;
  }, DEBOUNCE_MS);
}

export async function stopMonitoring(): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (subscription) {
    subscription.remove();
    subscription = null;
  }

  // Close final segment
  if (currentSegmentDbId !== null) {
    await updateActivitySegment(currentSegmentDbId, { endTime: Date.now() });
    currentSegmentDbId = null;
  }

  try {
    await ActivityRecognitionModule.stopMonitoring();
  } catch (e) {
    console.warn('[ActivityMonitor] Error stopping:', e);
  }

  currentActivity = 'unknown';
  pendingActivity = null;
  onChangeCallback = null;
}

/**
 * Determines the dominant activity type from segment durations.
 */
export function getDominantActivity(
  segments: { activityType: SegmentActivityType; startTime: number; endTime: number | null }[],
): SegmentActivityType {
  const durations = new Map<SegmentActivityType, number>();

  for (const segment of segments) {
    const end = segment.endTime ?? Date.now();
    const duration = end - segment.startTime;
    durations.set(
      segment.activityType,
      (durations.get(segment.activityType) ?? 0) + duration,
    );
  }

  // Remove stationary and unknown from consideration
  durations.delete('stationary');
  durations.delete('unknown');

  if (durations.size === 0) return 'unknown';

  let maxType: SegmentActivityType = 'unknown';
  let maxDuration = 0;
  for (const [type, duration] of durations) {
    if (duration > maxDuration) {
      maxType = type;
      maxDuration = duration;
    }
  }

  return maxType;
}
