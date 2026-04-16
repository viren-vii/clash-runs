/**
 * Precision Performance — "The Kinetic Lab" design system.
 *
 * Color palette and typography tokens for the app. Dark is the primary
 * aesthetic; light is a derived variant that preserves the same accent hues
 * (Electric Lime / Cyber Blue / Performance Purple) on light surfaces.
 *
 * Depth is conveyed through surface-container tiers (tonal layering), not
 * 1px borders or drop shadows. See the Colors block below for the full token
 * set and the Typography block for the Space Grotesk / Inter scale.
 */

// -----------------------------------------------------------------------------
// Raw brand palette (non-themed reference values)
// -----------------------------------------------------------------------------

const Brand = {
  // Electric Lime — "the pulse" (dark surfaces)
  lime: '#cafd00',
  limeDim: '#f3ffca',
  // Deep Lime — same hue, legible on light surfaces
  limeDeep: '#5a7a00',
  // Cyber Blue — running / focus
  cyberBlue: '#0070eb',
  cyberBlueLight: '#679cff',
  cyberBlueDeep: '#0052b3',
  // Performance Purple — cycling
  purple: '#e69dff',
  purpleDeep: '#7c3aed',
  // Walking Teal — custom (design-system carve-out)
  teal: '#14b8a6',
  tealDeep: '#0d7a6e',
  // Alert
  error: '#ff7351',
  errorDeep: '#c63518',
} as const;

// -----------------------------------------------------------------------------
// Theme tokens (Material-3 inspired; "no-line" rule via surface-container tiers)
// -----------------------------------------------------------------------------

export const Colors = {
  dark: {
    // Primary — Electric Lime ("light source")
    primary: Brand.lime,
    primaryDim: Brand.limeDim,
    onPrimary: '#0b0f00',

    // Secondary — Cyber Blue (Running)
    secondary: Brand.cyberBlueLight,
    onSecondary: '#00152e',

    // Tertiary — Performance Purple (Cycling)
    tertiary: Brand.purple,
    onTertiary: '#2b0037',

    // Walking accent
    walking: Brand.teal,

    // Status / error
    error: Brand.error,
    onError: '#2a0a00',

    // Surface tiers — tonal layering (lowest → highest). Dark "instrument" base.
    surface: '#0b0d0e',
    surfaceContainerLowest: '#0f1112',
    surfaceContainerLow: '#15181a',
    surfaceContainer: '#1b1e20',
    surfaceContainerHigh: '#23272a',
    surfaceContainerHighest: '#2b3034',
    surfaceVariant: '#1f2326',

    // Foreground ink
    onSurface: '#eef1f3',
    onSurfaceVariant: '#9aa3a9',
    onSurfaceDim: '#6d767c',

    // Outline — use sparingly, "ghost border" at ~15% opacity
    outline: '#4a5257',
    outlineVariant: '#2a2f33',

    // Live-HUD overlay (60% opacity + 20px backdrop blur)
    scrim: '#000000',
  },
  light: {
    // Deep lime — same hue family as dark's Electric Lime, but saturated/dark
    // enough to pass WCAG AA on light backgrounds (#5a7a00 on #eef2f5 ≈ 7.0:1)
    primary: Brand.limeDeep,
    primaryDim: '#7fa300',
    onPrimary: '#ffffff',

    // Cyber Blue — deeper variant for legibility on light surfaces
    secondary: Brand.cyberBlueDeep,
    onSecondary: '#ffffff',

    // Performance Purple — deeper variant for light surfaces
    tertiary: Brand.purpleDeep,
    onTertiary: '#ffffff',

    walking: Brand.tealDeep,

    error: Brand.errorDeep,
    onError: '#ffffff',

    // Cool-gray tonal ladder — clear separation between tiers so cards read as
    // elevated without borders. Each step ~5–7 lightness units for visible lift.
    surface: '#eef2f5',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f6f8fa',
    surfaceContainer: '#e4e9ed',
    surfaceContainerHigh: '#d7dde2',
    surfaceContainerHighest: '#cad1d7',
    surfaceVariant: '#e4e9ed',

    // Softer near-black (not pure) for a less harsh feel — tuned to ~14:1 on surface
    onSurface: '#161a1d',
    onSurfaceVariant: '#4a5258',
    onSurfaceDim: '#6f787e',

    outline: '#8a939a',
    outlineVariant: '#bcc3c9',

    scrim: '#000000',
  },
} as const;

export type ColorScheme = keyof typeof Colors;
export type ColorToken = keyof (typeof Colors)['dark'] & keyof (typeof Colors)['light'];

// -----------------------------------------------------------------------------
// Activity & status color maps (resolve against a ColorScheme)
// -----------------------------------------------------------------------------

/**
 * Activity identity colors — Running uses Cyber Blue, Cycling uses Performance
 * Purple, Walking a custom Teal. Scheme-aware: dark palette uses the lighter
 * pastel variants (designed for dark surfaces); light palette uses saturated
 * deeper variants that keep ≥4.5:1 contrast on light surface tiers.
 */
export const ActivityColorsDark = {
  running: Brand.cyberBlueLight,
  cycling: Brand.purple,
  walking: Brand.teal,
  stationary: '#6d767c',
  unknown: '#9aa3a9',
  mixed: Brand.lime,
} as const;

export const ActivityColorsLight = {
  running: Brand.cyberBlueDeep,
  cycling: Brand.purpleDeep,
  walking: Brand.tealDeep,
  stationary: '#5a6268',
  unknown: '#6f787e',
  mixed: Brand.limeDeep,
} as const;

/** Resolve the right activity palette for the current color scheme. */
export function getActivityColors(scheme: ColorScheme) {
  return scheme === 'light' ? ActivityColorsLight : ActivityColorsDark;
}

/**
 * Back-compat default export — the dark-variant set. Prefer `getActivityColors`
 * in new code so colors adapt to the user's theme. Still used for map polylines,
 * which render against the dark map style regardless of app theme.
 */
export const ActivityColors = ActivityColorsDark;

/**
 * Status colors. "active" = Electric Lime (the pulse). "completed" uses Cyber
 * Blue to differentiate from an active/live state.
 */
export const StatusColors = {
  active: Brand.lime,
  paused: '#9aa3a9',
  completed: Brand.cyberBlueLight,
  error: Brand.error,
  warning: '#FF9800',
} as const;

// -----------------------------------------------------------------------------
// Typography — Space Grotesk (display) + Inter (body), tabular monospacing
// -----------------------------------------------------------------------------

export const FontFamilies = {
  display: 'SpaceGrotesk_700Bold',
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

/**
 * Typography scale. Performance metrics (pace, HR, time) MUST use
 * `fontVariant: ['tabular-nums']` to prevent digit jitter during a live
 * workout — every "metric" style below sets it.
 */
export const Typography = {
  displayLg: {
    fontFamily: FontFamilies.display,
    fontSize: 57,
    lineHeight: 60,
    letterSpacing: -1.14, // -2% of 57
  },
  displayMd: {
    fontFamily: FontFamilies.display,
    fontSize: 45,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  displaySm: {
    fontFamily: FontFamilies.display,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.25,
  },
  headlineLg: {
    fontFamily: FontFamilies.display,
    fontSize: 32,
    lineHeight: 36,
  },
  headlineMd: {
    fontFamily: FontFamilies.display,
    fontSize: 28,
    lineHeight: 32,
  },
  headlineSm: {
    fontFamily: FontFamilies.display,
    fontSize: 24,
    lineHeight: 28,
  },
  titleLg: {
    fontFamily: FontFamilies.displayMedium,
    fontSize: 22,
    lineHeight: 28,
  },
  titleMd: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 16,
    lineHeight: 22,
  },
  titleSm: {
    fontFamily: FontFamilies.bodySemiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  bodyLg: {
    fontFamily: FontFamilies.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: FontFamilies.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bodySm: {
    fontFamily: FontFamilies.body,
    fontSize: 12,
    lineHeight: 16,
  },
  labelLg: {
    fontFamily: FontFamilies.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMd: {
    fontFamily: FontFamilies.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSm: {
    fontFamily: FontFamilies.bodyMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.5,
  },

  // Metric styles — tabular figures. Pair with large display sizes for
  // live-stat cards.
  metricXl: {
    fontFamily: FontFamilies.display,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -1.28,
    fontVariant: ['tabular-nums' as const],
  },
  metricLg: {
    fontFamily: FontFamilies.display,
    fontSize: 48,
    lineHeight: 52,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums' as const],
  },
  metricMd: {
    fontFamily: FontFamilies.display,
    fontSize: 32,
    lineHeight: 36,
    fontVariant: ['tabular-nums' as const],
  },
  metricSm: {
    fontFamily: FontFamilies.displayMedium,
    fontSize: 20,
    lineHeight: 24,
    fontVariant: ['tabular-nums' as const],
  },
} as const;

// -----------------------------------------------------------------------------
// Shape, spacing, elevation
// -----------------------------------------------------------------------------

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20, // ~0.75rem — "squircle" CTA feel
  full: 9999,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

/**
 * Asymmetric page padding — 24px left, 16px right. Drives the "forward
 * momentum" feel called out in the Do's.
 */
export const PageInsets = {
  left: Spacing.xl,
  right: Spacing.lg,
} as const;

/**
 * Ambient "glow" shadow — 0 offset, 32 blur, ~6% tint of on-surface. Use
 * SPARINGLY; prefer tonal layering over shadows.
 */
export const Elevation = {
  ambient: {
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 8,
  },
} as const;

// Backwards-compat: a small alias to help callers that haven't migrated yet.
// Prefer `Typography.*` in new code.
export const Fonts = FontFamilies;
