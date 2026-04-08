# Testing

## Running Tests

```bash
npm test                # run all tests
npm run test:watch      # re-run on file changes
npm run test:coverage   # run with coverage report
```

Run a single file:

```bash
npx jest __tests__/lib/tracking/distance-calculator.test.ts
```

## How It Works

Tests use **Jest** via the `jest-expo` preset, which handles Babel transforms and React Native module resolution automatically.

- **Test files** live in `__tests__/`, mirroring the source tree (e.g. `lib/tracking/foo.ts` is tested by `__tests__/lib/tracking/foo.test.ts`).
- **Native module mocks** are defined in `jest.setup.ts` at the project root. This file runs before every test and stubs out modules that require a device runtime (expo-location, expo-sqlite, react-native-maps, etc.).
- **Path aliases** work in tests — `@/lib/...` resolves the same way it does in app code.
- **Coverage** is collected from `lib/` and `components/`, excluding platform-specific health adapters and background task definitions. Thresholds are 80% lines/functions.

See `TEST_PLAN.md` for the full prioritized list of what to test and how.
