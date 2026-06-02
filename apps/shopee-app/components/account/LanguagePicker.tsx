import React, { useCallback } from 'react'
import { View, Pressable } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useAppStore } from '@/store/appStore'
import { LANGUAGES, LanguageCode } from '@/config/i18n'

interface LanguagePickerProps {
  bottomSheetRef: React.RefObject<BottomSheetModal>
}

export default function LanguagePicker({ bottomSheetRef }: LanguagePickerProps) {
  const { t } = useTranslation()
  const colors = useColors()
  const language = useAppStore((state) => state.language)
  const setLanguage = useAppStore((state) => state.setLanguage)

  const renderBackdrop = useCallback(
    (
      props: Parameters<
        NonNullable<React.ComponentProps<typeof BottomSheetModal>['backdropComponent']>
      >[0]
    ) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />,
    []
  )

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code)
    bottomSheetRef.current?.dismiss()
  }

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: colors.neutrals1000 }}
      handleIndicatorStyle={{ backgroundColor: colors.neutrals400 }}>
      <BottomSheetView>
        <View className="px-4 pb-8 pt-2">
          <AppText raw variant="heading3" weight="semibold" className="mb-4">
            {t('languagePicker.title')}
          </AppText>

          {(
            Object.values(LANGUAGES) as { code: LanguageCode; nativeName: string; name: string }[]
          ).map((lang) => {
            const isActive = language === lang.code
            return (
              <Pressable
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                className={`mb-2 flex-row items-center justify-between rounded-xl border px-4 py-3 ${
                  isActive ? 'border-primary bg-primary/10' : 'border-neutrals700 bg-transparent'
                }`}
                accessibilityRole="radio"
                accessibilityState={{ checked: isActive }}
                accessibilityLabel={lang.nativeName}>
                <View>
                  <AppText
                    raw
                    variant="body"
                    weight={isActive ? 'semibold' : 'regular'}
                    style={{ color: isActive ? colors.primary : colors.foreground }}>
                    {lang.nativeName}
                  </AppText>
                  <AppText raw variant="bodySmall" color="muted">
                    {lang.name}
                  </AppText>
                </View>
                {isActive && <Check size={20} color={colors.primary} />}
              </Pressable>
            )
          })}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
