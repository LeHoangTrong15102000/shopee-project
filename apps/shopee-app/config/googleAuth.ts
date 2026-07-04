import Constants from 'expo-constants'
import { Platform } from 'react-native'

interface GoogleAuthConfig {
  webClientId: string
  androidClientId: string
  iosClientId: string
}

const extra = Constants.expoConfig?.extra?.googleAuth as Partial<GoogleAuthConfig> | undefined

export const googleAuthConfig: GoogleAuthConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra?.webClientId ?? '',
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? extra?.androidClientId ?? '',
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra?.iosClientId ?? '',
}

export function isValidClientId(id?: string): boolean {
  if (!id) return false
  if (id.toUpperCase().includes('YOUR_')) return false
  if (!id.endsWith('.apps.googleusercontent.com')) return false
  return true
}

export const isGoogleAuthConfigured: boolean = (() => {
  if (!isValidClientId(googleAuthConfig.webClientId)) return false
  if (Platform.OS === 'android') {
    return isValidClientId(googleAuthConfig.androidClientId)
  }
  if (Platform.OS === 'ios') {
    return isValidClientId(googleAuthConfig.iosClientId)
  }
  // web / other — only webClientId required
  return true
})()
