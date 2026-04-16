import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Icon, type IconName } from '@/components/ui/icon';

export type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  action?: React.ReactNode;
  compact?: boolean;
  style?: ViewStyle;
};

/**
 * Editorial empty state. One icon, one headline, one supporting line, one CTA.
 * Pairs nicely inside a `SurfaceCard` on the home / history screens.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
  style,
}: EmptyStateProps) {
  return (
    <View style={[compact ? styles.rootCompact : styles.root, style]}>
      {icon ? (
        <Icon name={icon} size={compact ? 28 : 40} color="onSurfaceVariant" />
      ) : null}
      <ThemedText
        variant={compact ? 'titleMd' : 'headlineSm'}
        color="onSurface"
        style={styles.title}
      >
        {title}
      </ThemedText>
      {description ? (
        <ThemedText
          variant="bodyMd"
          color="onSurfaceVariant"
          style={styles.description}
        >
          {description}
        </ThemedText>
      ) : null}
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  rootCompact: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  description: {
    textAlign: 'center',
  },
  action: {
    marginTop: Spacing.md,
  },
});
