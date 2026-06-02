import React, { useCallback, useMemo, useRef } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ChevronRight } from 'lucide-react-native'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'
import { AppText, Switch } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { usePrivacySettingsStore } from '@/store/privacySettingsStore'
import { useToast } from '@/components/ui/ToastProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function PrivacySettingsScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const { showInfo } = useToast()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['35%'], [])

  const profileVisibility = usePrivacySettingsStore((s) => s.profileVisibility)
  const showOnlineStatus = usePrivacySettingsStore((s) => s.showOnlineStatus)
  const showPurchaseHistory = usePrivacySettingsStore((s) => s.showPurchaseHistory)
  const allowShopChat = usePrivacySettingsStore((s) => s.allowShopChat)
  const setProfileVisibility = usePrivacySettingsStore((s) => s.setProfileVisibility)
  const setShowOnlineStatus = usePrivacySettingsStore((s) => s.setShowOnlineStatus)
  const setShowPurchaseHistory = usePrivacySettingsStore((s) => s.setShowPurchaseHistory)
  const setAllowShopChat = usePrivacySettingsStore((s) => s.setAllowShopChat)

  const visibilityLabel = useMemo(() => {
    switch (profileVisibility) {
      case 'public':
        return t('settings.privacy.profileVisibility.public')
      case 'friends':
        return t('settings.privacy.profileVisibility.friendsOnly')
      case 'private':
        return t('settings.privacy.profileVisibility.private')
    }
  }, [profileVisibility, t])

  const openVisibilitySheet = () => bottomSheetRef.current?.expand()

  const selectVisibility = (value: 'public' | 'friends' | 'private') => {
    setProfileVisibility(value)
    bottomSheetRef.current?.close()
  }

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />,
    []
  )

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('settings.privacy.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}>
          {/* Profile Section */}
          <AppText
            variant="caption"
            weight="semibold"
            style={{ color: colors.neutrals100, marginBottom: 8 }}>
            {t('settings.privacy.profile')}
          </AppText>
          <Pressable
            onPress={openVisibilitySheet}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.neutrals800,
            }}
            accessibilityRole="button">
            <View>
              <AppText variant="body" raw>
                {t('settings.privacy.profileVisibility')}
              </AppText>
              <AppText variant="caption" style={{ color: colors.neutrals100, marginTop: 2 }}>
                {visibilityLabel}
              </AppText>
            </View>
            <ChevronRight size={20} color={colors.neutrals100} />
          </Pressable>

          {/* Activity Section */}
          <AppText
            variant="caption"
            weight="semibold"
            style={{ color: colors.neutrals100, marginTop: 24, marginBottom: 8 }}>
            {t('settings.privacy.activity')}
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.neutrals800,
            }}>
            <AppText variant="body" raw>
              {t('settings.privacy.showOnlineStatus')}
            </AppText>
            <Switch value={showOnlineStatus} onValueChange={setShowOnlineStatus} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.neutrals800,
            }}>
            <AppText variant="body" raw style={{ flex: 1, marginRight: 12 }}>
              {t('settings.privacy.showPurchaseHistory')}
            </AppText>
            <Switch value={showPurchaseHistory} onValueChange={setShowPurchaseHistory} />
          </View>

          {/* Messaging Section */}
          <AppText
            variant="caption"
            weight="semibold"
            style={{ color: colors.neutrals100, marginTop: 24, marginBottom: 8 }}>
            {t('settings.privacy.messaging')}
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.neutrals800,
            }}>
            <AppText variant="body" raw>
              {t('settings.privacy.allowShopChat')}
            </AppText>
            <Switch value={allowShopChat} onValueChange={setAllowShopChat} />
          </View>

          {/* Data Section */}
          <AppText
            variant="caption"
            weight="semibold"
            style={{ color: colors.neutrals100, marginTop: 24, marginBottom: 8 }}>
            {t('settings.privacy.data')}
          </AppText>
          <Pressable
            onPress={() => showInfo(t('settings.privacy.dataComingSoon'))}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: colors.neutrals800,
            }}
            accessibilityRole="button">
            <AppText variant="body" raw>
              {t('settings.privacy.dataPersonalization')}
            </AppText>
            <ChevronRight size={20} color={colors.neutrals100} />
          </Pressable>
        </ScrollView>

        {/* Profile Visibility Bottom Sheet */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ backgroundColor: colors.neutrals800 }}>
          <BottomSheetView style={{ padding: 16, gap: 4 }}>
            <AppText
              variant="heading3"
              weight="semibold"
              style={{ marginBottom: 12, color: colors.foreground }}>
              {t('settings.privacy.profileVisibility')}
            </AppText>
            {(['public', 'friends', 'private'] as const).map((option) => (
              <Pressable
                key={option}
                onPress={() => selectVisibility(option)}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor:
                    profileVisibility === option ? colors.primary + '15' : 'transparent',
                }}
                accessibilityRole="radio"
                accessibilityState={{ selected: profileVisibility === option }}>
                <AppText
                  variant="body"
                  weight={profileVisibility === option ? 'semibold' : 'regular'}
                  style={{
                    color: profileVisibility === option ? colors.primary : colors.foreground,
                  }}>
                  {option === 'public' && t('settings.privacy.profileVisibility.public')}
                  {option === 'friends' && t('settings.privacy.profileVisibility.friendsOnly')}
                  {option === 'private' && t('settings.privacy.profileVisibility.private')}
                </AppText>
              </Pressable>
            ))}
          </BottomSheetView>
        </BottomSheet>
      </SafeAreaView>
    </>
  )
}
