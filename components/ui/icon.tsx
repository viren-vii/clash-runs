import React from 'react';
import {
  Footprints,
  PersonStanding,
  Bike,
  Zap,
  Timer,
  MapPin,
  Activity,
  TrendingUp,
  Flame,
  Mountain,
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Info,
  AlertTriangle,
  Settings,
  History,
  Home,
  User,
  Navigation,
  Target,
  Clock,
  Calendar,
  Trash2,
  ArrowLeft,
  RotateCcw,
  type LucideProps,
} from 'lucide-react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { type ColorToken } from '@/constants/theme';
import type { SessionActivityType } from '@/lib/types';

/**
 * Icon registry. All icons used in the app pass through here so the design
 * system can control stroke width, sizing, and color-token resolution in
 * one place. Lucide is chosen for its geometric, 2px-stroke aesthetic that
 * matches the Precision / Kinetic Lab feel.
 */
export const Icons = {
  // Activity identity
  walk: PersonStanding,
  run: Footprints,
  cycle: Bike,
  mixed: Activity,
  unknown: Zap,

  // Stats / metrics
  pace: Timer,
  distance: MapPin,
  time: Clock,
  calories: Flame,
  elevation: Mountain,
  speed: TrendingUp,

  // Controls
  play: Play,
  pause: Pause,
  stop: Square,

  // Navigation
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  chevronDown: ChevronDown,
  back: ArrowLeft,
  close: X,
  check: Check,
  recenter: Navigation,
  target: Target,
  history: History,
  home: Home,
  profile: User,
  settings: Settings,
  calendar: Calendar,
  trash: Trash2,
  reset: RotateCcw,

  // Feedback
  info: Info,
  warning: AlertTriangle,
} as const;

export type IconName = keyof typeof Icons;

export type IconProps = Omit<LucideProps, 'color'> & {
  name: IconName;
  size?: number;
  /** Design-system color token, or a raw hex/rgba string. */
  color?: ColorToken | string;
  strokeWidth?: number;
};

const TOKEN_RE = /^[a-zA-Z]+$/;

/**
 * Resolve a color token or literal hex/rgba string to a concrete color.
 * A bare word (e.g. `onSurface`) is treated as a theme token; anything with
 * `#`, `(`, or a space is treated as a literal color.
 */
function useResolvedColor(color: ColorToken | string | undefined): string {
  // Default to onSurface so icons always have a visible, theme-aware color.
  const fallback = useThemeColor({}, 'onSurface');
  const looksLikeToken = !!color && TOKEN_RE.test(color);
  const tokenColor = useThemeColor(
    {},
    (looksLikeToken ? (color as ColorToken) : 'onSurface'),
  );
  if (!color) return fallback;
  if (looksLikeToken) return tokenColor;
  return color;
}

/**
 * App-wide icon component. Defaults to 20px / stroke 2 which pairs with the
 * `bodyMd` line height. Use `size="sm"` via the explicit numeric prop when a
 * tighter fit is needed.
 */
export function Icon({
  name,
  size = 20,
  color,
  strokeWidth = 2,
  ...rest
}: IconProps) {
  const LucideIcon = Icons[name];
  const resolved = useResolvedColor(color);
  return (
    <LucideIcon
      size={size}
      color={resolved}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
}

/** Convenience mapping from our activity-type enum to an icon name. */
export const ACTIVITY_ICON: Record<SessionActivityType, IconName> = {
  walk: 'walk',
  run: 'run',
  cycle: 'cycle',
  mixed: 'mixed',
};
