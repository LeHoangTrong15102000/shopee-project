import { View } from 'react-native';
import { AppText } from '@/components/ui';

export default function HomeScreen() {
  return (
    <View className={'p-safe-offset-4'}>
      <AppText className="text-2xl font-semibold">Home</AppText>
    </View>
  );
}

