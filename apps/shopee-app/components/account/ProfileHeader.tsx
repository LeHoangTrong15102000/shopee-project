import React from 'react'
import { View, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { AppText, AppImage } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { type User } from '@/types/user.type'

interface ProfileHeaderProps {
  user: User | null
  isLoading?: boolean
}

export default function ProfileHeader({ user, isLoading }: ProfileHeaderProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()

  const displayName = user?.name || user?.email || t('profileHeader.defaultName')
  const initials = displayName.charAt(0).toUpperCase()

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ paddingHorizontal: 16, paddingVertical: 24 }}>
      <View className="flex-row items-center gap-4">
        {user?.avatar ? (
          <AppImage
            source={{ uri: user.avatar }}
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              borderWidth: 2,
              borderColor: colors.primaryForeground,
            }}
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
              borderColor: colors.primaryForeground,
            }}>
            <AppText raw variant="heading2" style={{ color: colors.primaryForeground }}>
              {initials}
            </AppText>
          </View>
        )}

        <View className="flex-1">
          <AppText
            raw
            variant="body"
            weight="bold"
            style={{ color: colors.primaryForeground }}
            numberOfLines={1}>
            {isLoading ? '...' : displayName}
          </AppText>
          {user?.email && (
            <AppText
              raw
              variant="bodySmall"
              style={{ color: colors.primaryForeground + 'CC' }}
              numberOfLines={1}>
              {user.email}
            </AppText>
          )}
          <TouchableOpacity
            onPress={() => router.push('/profile-edit')}
            style={{ marginTop: 6, alignSelf: 'flex-start' }}>
            <AppText
              raw
              variant="labelSmall"
              style={{ color: colors.primaryForeground + 'E6', textDecorationLine: 'underline' }}>
              {t('profileHeader.button.edit')}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}
