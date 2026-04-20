import React from 'react'
import { View, Image, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { type User } from '@/types/user.type'

interface ProfileHeaderProps {
  user: User | null
  isLoading?: boolean
}

export default function ProfileHeader({ user, isLoading }: ProfileHeaderProps) {
  const colors = useColors()
  const router = useRouter()

  const displayName = user?.name || user?.email || 'Người dùng'
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
      <View className="flex-row items-center gap-4">
        {user?.avatar ? (
          <Image
            source={{ uri: user.avatar }}
            style={{ width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: '#fff' }}
          />
        ) : (
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#fff',
            }}>
            <AppText raw variant="heading2" style={{ color: '#fff' }}>
              {initials}
            </AppText>
          </View>
        )}

        <View className="flex-1">
          <AppText raw variant="body" weight="bold" style={{ color: '#fff' }} numberOfLines={1}>
            {isLoading ? '...' : displayName}
          </AppText>
          {user?.email && (
            <AppText raw variant="bodySmall" style={{ color: 'rgba(255,255,255,0.8)' }} numberOfLines={1}>
              {user.email}
            </AppText>
          )}
          <TouchableOpacity
            onPress={() => router.push('/profile-edit')}
            style={{ marginTop: 6, alignSelf: 'flex-start' }}>
            <AppText raw variant="labelSmall" style={{ color: 'rgba(255,255,255,0.9)', textDecorationLine: 'underline' }}>
              Sửa hồ sơ
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}
