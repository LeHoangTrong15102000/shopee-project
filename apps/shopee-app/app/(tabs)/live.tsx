import { View } from 'react-native'
import { AppText } from '@/components/ui'

export default function LiveScreen() {
  return (
    <View className="p-safe-offset-4 flex-1 items-center justify-center bg-background">
      <AppText variant="heading2">TAB_LIVE</AppText>
    </View>
  )
}
