import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import { useAppStore } from '@/store/appStore';

export default function InsetsHelper() {
  const insets = useSafeAreaInsets();
  const setInsets = useAppStore((state) => state.setInsets);

  useEffect(() => {
    setInsets(insets);
  }, [insets, setInsets]);

  return <></>;
}
