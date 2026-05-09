import { Stack } from 'expo-router'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function AiChatLayout() {
  return (
    <Stack
      screenOptions={{
        header: (props) => <CustomScreenHeader {...props} />,
      }}
    />
  )
}
