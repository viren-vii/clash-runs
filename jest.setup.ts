// ============================================================
// Jest Setup — Native Module Mocks for Clash Runs
// ============================================================

// expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted' }),
  requestBackgroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted' }),
  watchPositionAsync: jest.fn().mockResolvedValue({ remove: jest.fn() }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: {
      latitude: 37.7749,
      longitude: -122.4194,
      altitude: 0,
      accuracy: 5,
      speed: 0,
    },
    timestamp: Date.now(),
  }),
  Accuracy: {
    Lowest: 1,
    Low: 2,
    Balanced: 3,
    High: 4,
    Highest: 5,
    BestForNavigation: 6,
  },
  ActivityType: {
    Other: 1,
    AutomotiveNavigation: 2,
    Fitness: 3,
    OtherNavigation: 4,
  },
}));

// expo-task-manager
jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
  isTaskRegisteredAsync: jest.fn().mockResolvedValue(false),
  unregisterTaskAsync: jest.fn().mockResolvedValue(undefined),
}));

// expo-sqlite — no built-in Jest mock in SDK 54
jest.mock('expo-sqlite', () => {
  const mockDb = {
    runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
    execAsync: jest.fn().mockResolvedValue(undefined),
    withTransactionAsync: jest.fn(async (fn: () => Promise<void>) => fn()),
    withExclusiveTransactionAsync: jest.fn(
      async (fn: (txn: unknown) => Promise<void>) => fn(mockDb),
    ),
  };
  return {
    openDatabaseSync: jest.fn(() => mockDb),
    openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
    __mockDb: mockDb,
  };
});

// expo-crypto
jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'test-uuid-1234'),
}));

// expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

// expo-sensors (accelerometer used by activity-monitor)
jest.mock('expo-sensors', () => ({
  Accelerometer: {
    addListener: jest.fn(() => ({ remove: jest.fn() })),
    setUpdateInterval: jest.fn(),
    isAvailableAsync: jest.fn().mockResolvedValue(true),
  },
  Pedometer: {
    watchStepCount: jest.fn(() => ({ remove: jest.fn() })),
    isAvailableAsync: jest.fn().mockResolvedValue(true),
  },
}));

// expo-notifications (removed from dependencies — virtual mock for any transitive references)
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  getPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted', granted: true }),
  requestPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted', granted: true }),
}), { virtual: true });

// expo-background-task
jest.mock('expo-background-task', () => ({
  registerBackgroundTask: jest.fn(),
  unregisterBackgroundTask: jest.fn(),
}));

// react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const MapView = React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
    React.createElement('MapView', { ...props, ref }),
  );
  MapView.displayName = 'MapView';
  const Polyline = (props: Record<string, unknown>) =>
    React.createElement('Polyline', props);
  const Marker = (props: Record<string, unknown>) =>
    React.createElement('Marker', props);
  return {
    __esModule: true,
    default: MapView,
    Polyline,
    Marker,
    PROVIDER_GOOGLE: 'google',
  };
});

// @react-native-async-storage/async-storage — jest-expo preset handles this,
// but we add a fallback in case:
jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    removeItem: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach((k) => delete store[k]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    multiGet: jest.fn((keys: string[]) =>
      Promise.resolve(keys.map((k) => [k, store[k] ?? null])),
    ),
    multiSet: jest.fn((pairs: [string, string][]) => {
      pairs.forEach(([k, v]) => {
        store[k] = v;
      });
      return Promise.resolve();
    }),
  };
});

// Health integrations — platform-gated, mock the whole module
jest.mock('@kingstinct/react-native-healthkit', () => ({}));
jest.mock('react-native-health-connect', () => ({}));

// expo-blur — BlurView is a visual effect, render as a plain View in tests
jest.mock('expo-blur', () => {
  const React = require('react');
  return {
    BlurView: (props: Record<string, unknown>) =>
      React.createElement('BlurView', props),
  };
});

// expo-secure-store
jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn((key: string, value: string) => {
      store[key] = value;
      return Promise.resolve();
    }),
    getItemAsync: jest.fn((key: string) => Promise.resolve(store[key] ?? null)),
    deleteItemAsync: jest.fn((key: string) => {
      delete store[key];
      return Promise.resolve();
    }),
    __store: store,
    __clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
  };
});

// expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([2]),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
}));

// lucide-react-native — render icons as simple placeholders in tests.
// Using a Proxy lets any `lucide.Footprints`/`lucide.Zap` import resolve.
jest.mock('lucide-react-native', () => {
  const React = require('react');
  const stub = (name: string) => {
    const Comp = (props: Record<string, unknown>) =>
      React.createElement('LucideIcon', { ...props, 'data-name': name });
    Comp.displayName = name;
    return Comp;
  };
  return new Proxy(
    {},
    {
      get: (_t, key: string) => stub(key),
    },
  );
});
