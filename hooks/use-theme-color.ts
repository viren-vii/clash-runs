/**
 * Resolve a themed color token for the current color scheme.
 *
 * Learn more about color schemes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors, type ColorToken } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ColorToken,
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}
