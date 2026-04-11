/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#4CAF50';
const tintColorDark = '#66BB6A';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    card: '#F0F0F0',
    border: '#DCDCDC',
    subtle: '#9E9E9E',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    card: '#1E2022',
    border: '#2C2F33',
    subtle: '#687076',
  },
};

export const ActivityColors = {
  running: '#4CAF50',
  walking: '#2196F3',
  cycling: '#FF9800',
  stationary: '#9E9E9E',
  unknown: '#4CAF50',
};

export const StatusColors = {
  active: '#F44336',
  paused: '#FFC107',
  completed: '#4CAF50',
};

