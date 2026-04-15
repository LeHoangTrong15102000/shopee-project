import { useAppStore } from '@/store/appStore'

export const useInsets = () => {
  const insets = useAppStore((state) => state.insets)
  return insets
}
