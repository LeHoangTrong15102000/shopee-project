import { AppColors, AppColorsLight } from '../config/colors';
import { useAppStore } from '@/store/appStore';

export function useColors() {
  const theme = useAppStore((state) => state.theme);
  if (theme === 'light') return AppColorsLight;
  return AppColors;
}
