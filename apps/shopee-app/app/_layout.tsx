import '../config/global.css'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import InsetsHelper from '@/components/helpers/InsetsHelper.tsx'
import { LanguageHelper } from '@/components/helpers/LanguageHelper.tsx'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/config/queryClient'
import { useColors } from '@/hooks/useColors.ts'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { ToastProvider } from '@/components/ui/ToastProvider'
import { DialogProvider } from '@/components/ui/DialogProvider'
import { View } from 'react-native'
import { useEffect, useState } from 'react'

function AppContent() {
  const theme = useAppStore((state) => state.theme)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const colors = useColors()
  const segments = useSegments()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait for store rehydration
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setIsReady(true)
    })
    // If already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setIsReady(true)
    }
    return unsub
  }, [])

  useEffect(() => {
    if (!isReady) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/sign-in')
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/home')
    }
  }, [isAuthenticated, segments, isReady])

  const navigationTheme = {
    ...(theme === 'dark' ? DarkTheme : DefaultTheme),
    dark: theme === 'dark',
    colors: {
      ...(theme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.neutrals800,
      text: colors.foreground,
      border: colors.neutrals700,
      notification: colors.primary,
    },
  }

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />
  }

  return (
    <View style={{ flex: 1 }} className={theme === 'dark' ? 'dark' : ''}>
      <GestureHandlerRootView>
        <SafeAreaProvider>
          <BottomSheetModalProvider>
            <DialogProvider>
              <ThemeProvider value={navigationTheme}>
                <Stack>
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="search" options={{ headerShown: false }} />
                  <Stack.Screen name="checkout" options={{ headerShown: false }} />
                  <Stack.Screen name="order-success" options={{ headerShown: false }} />
                  <Stack.Screen name="orders" options={{ headerShown: false }} />
                  <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
                  <Stack.Screen name="addresses" options={{ headerShown: false }} />
                  <Stack.Screen name="address-form" options={{ headerShown: false }} />
                  <Stack.Screen name="wishlist" options={{ headerShown: false }} />
                  <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
                  <Stack.Screen name="change-password" options={{ headerShown: false }} />
                  <Stack.Screen name="vouchers" options={{ headerShown: false }} />
                  <Stack.Screen name="checkin" options={{ headerShown: false }} />
                </Stack>
              </ThemeProvider>
            </DialogProvider>
            <StatusBar style="auto" />
            <LanguageHelper />
            <InsetsHelper />
          </BottomSheetModalProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </QueryClientProvider>
  )
}
