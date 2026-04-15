import { Redirect, Stack } from 'expo-router'
import { useAuthStore } from '@/store/authStore'

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />
  }

  return <Stack screenOptions={{ headerShown: false }} />
}
