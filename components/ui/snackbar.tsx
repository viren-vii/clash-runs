import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PageInsets, Radii, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';

type Severity = 'info' | 'success' | 'warning' | 'error';

type SnackbarItem = {
  id: number;
  message: string;
  severity: Severity;
  actionLabel?: string;
  onAction?: () => void;
};

type SnackbarContextValue = {
  show: (message: string, opts?: Partial<Omit<SnackbarItem, 'id' | 'message'>>) => void;
  dismiss: () => void;
};

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

const SEVERITY_ICON: Record<Severity, IconName> = {
  info: 'info',
  success: 'check',
  warning: 'warning',
  error: 'warning',
};

// Scheme-aware accent: pastel variants on dark, deeper saturated variants on
// light so the icon + action text meet ≥4.5:1 contrast on surfaceContainerHighest.
const SEVERITY_COLOR: Record<'light' | 'dark', Record<Severity, string>> = {
  dark: {
    info: '#679cff',
    success: '#cafd00',
    warning: '#FF9800',
    error: '#ff7351',
  },
  light: {
    info: '#0052b3',
    success: '#5a7a00',
    warning: '#b26700',
    error: '#c63518',
  },
};

/**
 * In-app snackbar host. Wrap the app once at the root; call `useSnackbar().show`
 * from anywhere to surface a non-blocking message (replaces `Alert.alert` for
 * non-destructive notifications).
 */
export function SnackbarHost({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<SnackbarItem | null>(null);
  const translateY = useRef(new Animated.Value(100)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bg = useThemeColor({}, 'surfaceContainerHighest');
  const scheme = useColorScheme() ?? 'dark';
  const severityColors = SEVERITY_COLOR[scheme];

  const dismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: 120,
      duration: 180,
      useNativeDriver: true,
    }).start(() => setItem(null));
  }, [translateY]);

  const show = useCallback<SnackbarContextValue['show']>(
    (message, opts) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setItem({
        id: Date.now(),
        message,
        severity: opts?.severity ?? 'info',
        actionLabel: opts?.actionLabel,
        onAction: opts?.onAction,
      });
      translateY.setValue(100);
      Animated.spring(translateY, {
        toValue: 0,
        damping: 18,
        stiffness: 160,
        useNativeDriver: true,
      }).start();
      timerRef.current = setTimeout(dismiss, 3500);
    },
    [translateY, dismiss],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <SnackbarContext.Provider value={{ show, dismiss }}>
      {children}
      {item ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.host,
            {
              bottom: insets.bottom + Spacing.md,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.card, { backgroundColor: bg }]}>
            <Icon
              name={SEVERITY_ICON[item.severity]}
              size={18}
              color={severityColors[item.severity]}
            />
            <ThemedText
              variant="bodyMd"
              color="onSurface"
              style={styles.message}
              numberOfLines={2}
            >
              {item.message}
            </ThemedText>
            {item.actionLabel ? (
              <Pressable
                onPress={() => {
                  item.onAction?.();
                  dismiss();
                }}
                hitSlop={8}
                accessibilityRole="button"
              >
                <ThemedText
                  variant="labelLg"
                  style={{ color: severityColors[item.severity] }}
                >
                  {item.actionLabel}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx)
    throw new Error('useSnackbar must be used inside <SnackbarHost>');
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: PageInsets.left,
    right: PageInsets.right,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.xl,
  },
  message: {
    flex: 1,
  },
});
