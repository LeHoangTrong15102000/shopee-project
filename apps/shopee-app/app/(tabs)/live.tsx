import { View } from 'react-native';
import { AppText } from '@/components/ui';

export default function LiveScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-background p-safe-offset-4">
      <AppText variant="heading2">TAB_LIVE</AppText>
    </View>
  );
}
