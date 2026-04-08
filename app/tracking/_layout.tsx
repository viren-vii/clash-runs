import { Stack } from 'expo-router';

export default function TrackingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
      <Stack.Screen name="pre-start" />
      <Stack.Screen name="active" />
      <Stack.Screen name="summary" />
    </Stack>
  );
}
