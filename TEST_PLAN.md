# Clash Runs — Test Plan

## Testing Stack

| Layer              | Tool                                  | Notes                                                                 |
|--------------------|---------------------------------------|-----------------------------------------------------------------------|
| Unit / Component   | Jest 29 (`jest-expo` preset)          | Vitest incompatible with Metro transforms. `jest-expo` mocks SDK 54.  |
| Component          | `@testing-library/react-native` v13   | Built-in matchers (replaces deprecated `@testing-library/jest-native`)|
| E2E                | Maestro                               | YAML flows, low setup friction for Expo. Detox deferred.              |
| Coverage           | Jest built-in (Babel/Istanbul)        | 80% lines/functions on business logic.                                |

## Running Tests

```bash
npm test              # single run
npm run test:watch    # watch mode
npm run test:coverage # with coverage report
```

---

## Priority 1 — Pure Logic (no mocks needed)

These files are pure functions with zero native dependencies. Write these first.

### `lib/tracking/distance-calculator.ts` (~30 tests)

| Function               | Test Cases                                                                                           |
|------------------------|------------------------------------------------------------------------------------------------------|
| `haversineDistance`     | Same point → 0, known distance (NYC→LA ≈ 3,944 km), short distance (~100m), antipodal points        |
| `calculateTotalDistance`| Empty array → 0, single point → 0, two points, segment boundary skipped, multi-segment              |
| `isStationary`         | speed=null + lastMovement=0 → true, speed=0.1 → true, speed=0.5 → false, null speed + stale time → true, null speed + recent time → false |
| `calculatePace`        | 10km/60min → 6 min/km, zero distance → null, zero time → null, negative values → null               |
| `calculateSpeed`       | Normal case, zero time → null, zero distance → 0                                                    |
| `formatPace`           | null → `'--:--'`, Infinity → `'--:--'`, 6.0 metric → `'6:00'`, imperial conversion correct          |
| `formatDistance`       | 0m → `'0 m'`, 500m → `'500 m'`, 1500m → `'1.50 km'`, imperial: <0.1mi → feet, ≥0.1mi → miles       |
| `formatElapsedTime`    | 0ms → `'0:00'`, 30s → `'0:30'`, 90s → `'1:30'`, 3661s → `'1:01:01'`                                |
| `getPaceUnit`          | metric → `/km`, imperial → `/mi`                                                                    |
| `getDistanceUnit`      | metric → `km`, imperial → `mi`                                                                      |

**Critical regression guards** (pace infinity bug fix):
```typescript
it('returns null for zero elapsed time', () => expect(calculatePace(1000, 0)).toBeNull());
it('returns null for zero distance', () => expect(calculatePace(0, 60000)).toBeNull());
it('formats null pace as --:--', () => expect(formatPace(null, 'metric')).toBe('--:--'));
it('formats Infinity pace as --:--', () => expect(formatPace(Infinity, 'metric')).toBe('--:--'));
```

### `lib/tracking/point-filter.ts` (~12 tests)

| Function            | Test Cases                                                                                           |
|---------------------|------------------------------------------------------------------------------------------------------|
| `isValidPoint`      | No previous point → accepted, accuracy >30m → rejected, accuracy ≤30m → accepted, speed >50 m/s → rejected, speed ≤50 → accepted, time delta ≤0 → rejected, impossible acceleration (>15 m/s²) → rejected, normal acceleration → accepted, null accuracy/speed → accepted |
| `smoothRoutePoints` | Empty array → empty, ≤windowSize → unchanged, smooths within segment, does NOT smooth across segment boundaries, preserves non-lat/lng fields |

### `lib/map/map-utils.ts` (~10 tests)

| Function                    | Test Cases                                                                                 |
|-----------------------------|--------------------------------------------------------------------------------------------|
| `getRegionForCoordinates`   | Empty → SF default (37.7749, -122.4194), single point → centered with small delta, multi-point → padded bounding box |
| `coordinatesToPolyline`     | Maps RoutePoints to {latitude, longitude} array, preserves order                           |
| `segmentPolylines`          | Empty → [], single segment → one polyline, multi-segment → separate polylines with correct colors, continuity: last point of prev segment = first of next, unknown activity → default green |

### `lib/tracking/timer-service.ts` (~12 tests)

| Method      | Test Cases                                                                                        |
|-------------|---------------------------------------------------------------------------------------------------|
| `start`     | Resets accumulated, sets running                                                                  |
| `pause`     | Accumulates elapsed, stops running                                                                |
| `resume`    | Sets running again, doesn't reset accumulated                                                     |
| `stop`      | Returns total elapsed, stops running                                                              |
| `reset`     | Zeros everything                                                                                  |
| `getElapsedTime` | Running: accumulated + delta since resume. Paused: just accumulated. After multiple pause/resume cycles |
| `isRunning` | True after start/resume, false after pause/stop                                                   |
| `restore`   | Restores accumulated + running state correctly                                                    |

> **Note:** Use `jest.useFakeTimers()` and `jest.advanceTimersByTime()` for deterministic time tests.

### `lib/tracking/auto-pause.ts` (~8 tests)

| Method        | Test Cases                                                                                      |
|---------------|-------------------------------------------------------------------------------------------------|
| `start`       | Sets up interval check, initializes not-paused                                                  |
| `reportSpeed` | null → no-op, <0.3 → no movement update, ≥0.3 → updates movement time, resumes if was paused   |
| Auto-pause    | After 30s of no movement → callback(true), movement after pause → callback(false)               |
| `stop`        | Clears interval, resets state                                                                   |
| `isAutoPaused`| Reflects current pause state                                                                    |

> Use `jest.useFakeTimers()` with `jest.advanceTimersByTime(30000)`.

---

## Priority 2 — Services with Mocked Dependencies

### `lib/settings/settings-context.tsx`

| Scenario                         | What to assert                                                        |
|----------------------------------|-----------------------------------------------------------------------|
| Load on mount                    | Reads from AsyncStorage, sets defaults if empty                       |
| `setUnitSystem('imperial')`      | Persists to AsyncStorage, context value updates                       |
| `setTheme('dark')`               | Persists, context updates                                             |
| `setWeight(75)`                  | Persists, context updates                                             |
| Default values                   | metric, system theme, 70kg when AsyncStorage is empty                 |

**Mock:** `@react-native-async-storage/async-storage` (provided in jest.setup.ts)

### `lib/tracking/tracking-context.tsx`

| Scenario                         | What to assert                                                        |
|----------------------------------|-----------------------------------------------------------------------|
| Initial state                    | idle, not tracking, zero distance/time                                |
| `startSession()`                 | Delegates to session-manager, state becomes active                    |
| `pauseSession()`                 | State becomes paused                                                  |
| `resumeSession()`                | State becomes active again                                            |
| `stopSession()`                  | Returns session summary, state becomes idle                           |
| `discardSession()`               | State becomes idle, no summary                                        |

**Mock:** `lib/tracking/session-manager.ts`

### `lib/tracking/activity-monitor.ts`

| Scenario                         | What to assert                                                        |
|----------------------------------|-----------------------------------------------------------------------|
| `getDominantActivity` (empty)    | Returns 'unknown'                                                     |
| Single activity                  | Returns that activity                                                 |
| Multiple activities              | Returns the one with longest duration                                 |
| Ignores 'stationary'            | Stationary not counted as dominant                                    |
| Activity change debounce         | Doesn't flip-flop on rapid changes                                   |

**Mock:** `expo-sensors` (Accelerometer)

### `lib/tracking/permissions.ts`

| Scenario                                | What to assert                                              |
|-----------------------------------------|-------------------------------------------------------------|
| Foreground permission granted           | Returns true                                                |
| Foreground permission denied            | Returns false                                               |
| Background permission (granted)         | Returns true (requires foreground first)                    |
| Background permission (denied)          | Returns false                                               |

**Mock:** `expo-location` (provided in jest.setup.ts)

---

## Priority 3 — Database Repositories (Integration with Mocked SQLite)

Use the `expo-sqlite` mock from `jest.setup.ts`. Configure `mockDb.getAllAsync`/`getFirstAsync` per test.

### `lib/database/sessions-repository.ts`

| Scenario                         | SQL / assertion                                                       |
|----------------------------------|-----------------------------------------------------------------------|
| `createSession`                  | INSERT called with correct fields, returns session ID                 |
| `getActiveSession`               | SELECT WHERE status NOT IN ('completed','discarded')                  |
| `getAllSessions`                  | SELECT ordered by start_time DESC                                     |
| `updateSession` (partial)        | Only updates provided fields                                          |

### `lib/database/route-repository.ts`

| Scenario                         | SQL / assertion                                                       |
|----------------------------------|-----------------------------------------------------------------------|
| `insertRoutePointsBatch`         | Transaction used, correct INSERT per point                            |
| `getRoutePoints`                 | SELECT ordered by timestamp                                           |
| `getLastRoutePoint`              | Returns most recent point for session                                 |

### `lib/database/segments-repository.ts`

| Scenario                         | SQL / assertion                                                       |
|----------------------------------|-----------------------------------------------------------------------|
| `insertActivitySegment`          | INSERT with correct fields                                            |
| `getOpenSegment`                 | SELECT WHERE end_time IS NULL                                         |
| `updateActivitySegment`          | UPDATE with provided fields                                           |

### `lib/database/database.ts`

| Scenario                         | Assertion                                                             |
|----------------------------------|-----------------------------------------------------------------------|
| Schema creation                  | execAsync called with CREATE TABLE IF NOT EXISTS                      |
| Migration                        | Adds user_weight column if missing                                    |
| WAL mode                         | PRAGMA journal_mode = WAL executed                                    |

---

## Priority 4 — Component Tests

Use `@testing-library/react-native` `render`, `screen`, `fireEvent`.
Wrap navigation-dependent screens in a test NavigationContainer.

### `components/tracking/stats-display.tsx`

| Scenario                         | Assertion                                                             |
|----------------------------------|-----------------------------------------------------------------------|
| Normal mode                      | Shows time, distance, pace, speed                                     |
| Compact mode                     | Renders fewer stats                                                   |
| `invertColors`                   | Applies inverted style                                                |
| Metric vs imperial               | Correct units displayed                                               |

### `components/tracking/control-buttons.tsx`

| Scenario                         | Assertion                                                             |
|----------------------------------|-----------------------------------------------------------------------|
| Idle state                       | Shows start button only                                               |
| Active state                     | Shows pause + stop buttons                                            |
| Paused state                     | Shows resume + stop + discard buttons                                 |
| Button press                     | Calls correct handler, triggers haptic                                |

### `components/tracking/activity-type-picker.tsx`

| Scenario                         | Assertion                                                             |
|----------------------------------|-----------------------------------------------------------------------|
| Renders all activity types       | Run, Walk, Cycle visible                                              |
| Selection highlight              | Selected type is visually distinct                                    |
| `onSelect` callback              | Called with correct activity type                                     |

### `components/sessions/session-card.tsx`

| Scenario                         | Assertion                                                             |
|----------------------------------|-----------------------------------------------------------------------|
| Renders session data             | Activity emoji, distance, pace, date                                  |
| Tap navigates                    | onPress handler called                                                |

### `app/tracking/pre-start.tsx`

| Scenario                         | Assertion                                                             |
|----------------------------------|-----------------------------------------------------------------------|
| Permissions denied               | Start button disabled or error shown                                  |
| Loading state                    | Shows spinner during session start                                    |
| Successful start                 | Navigates to active tracking                                          |

### `app/(tabs)/index.tsx`

| Scenario                         | Assertion                                                             |
|----------------------------------|-----------------------------------------------------------------------|
| Empty state                      | Shows "no sessions" message                                           |
| Active session banner            | Shows tracking indicator                                              |
| Week stats                       | Calculates totals correctly                                           |

---

## Priority 5 — E2E with Maestro

Install: `curl -Ls "https://get.maestro.mobile.dev" | bash`

Create flows in `.maestro/` directory:

### Core Flows

1. **`start_and_stop_run.yaml`** — Launch → Start Run → see tracking → Stop → see summary → Done → home
2. **`pause_resume.yaml`** — Start → Pause → verify paused state → Resume → verify resumed → Stop
3. **`view_history.yaml`** — Complete a run → go to History tab → verify session card → tap to view details
4. **`permission_denied.yaml`** — Deny location permission → verify cannot start tracking
5. **`settings_units.yaml`** — Change unit to imperial in Settings → verify reflected in history/tracking

---

## Skip List (deferred)

| File / Area                                | Reason                                                              |
|--------------------------------------------|---------------------------------------------------------------------|
| `lib/health/healthkit-adapter.ios.ts`      | Platform-gated HealthKit; mock the interface, don't test adapter    |
| `lib/health/health-connect-adapter.android.ts` | Same — Android Health Connect adapter                          |
| `lib/tracking/recovery-service.ts`         | Complex time + health deps; defer until mock strategy is stable     |
| `lib/tracking/task-definitions.ts`         | Background task registration; can't unit test, cover via E2E        |
| `components/tracking/route-map.tsx`        | react-native-maps needs native renderer; cover via E2E screenshots  |

---

## Coverage Targets

| Area                                   | Target |
|----------------------------------------|--------|
| `lib/tracking/distance-calculator.ts`  | 100%   |
| `lib/tracking/point-filter.ts`         | 100%   |
| `lib/tracking/timer-service.ts`        | 100%   |
| `lib/map/map-utils.ts`                 | 100%   |
| All other `lib/`                       | 80%+   |
| Screens / components                   | 70%+   |
| `lib/health/`, background tasks        | Exempt |

## Test File Convention

```
__tests__/
  lib/
    tracking/
      distance-calculator.test.ts
      point-filter.test.ts
      timer-service.test.ts
      auto-pause.test.ts
    map/
      map-utils.test.ts
    database/
      sessions-repository.test.ts
      route-repository.test.ts
      segments-repository.test.ts
      database.test.ts
    settings/
      settings-context.test.tsx
    tracking/
      tracking-context.test.tsx
      activity-monitor.test.ts
      permissions.test.ts
  components/
    tracking/
      stats-display.test.tsx
      control-buttons.test.tsx
      activity-type-picker.test.tsx
    sessions/
      session-card.test.tsx
  app/
    tracking/
      pre-start.test.tsx
    tabs/
      index.test.tsx
```
