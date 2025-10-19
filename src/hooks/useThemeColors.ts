import { useTheme } from '../contexts/ThemeContext';
import { LIGHT_COLORS, DARK_COLORS } from '../lib/constants/ui';

export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
};
