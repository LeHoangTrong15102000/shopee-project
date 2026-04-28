import React from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Play } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'

export default function LiveScreen() {
  const { t } = useTranslation()
  const colors = useColors()

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 16 }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.primary + '20',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Play size={52} color={colors.primary} fill={colors.primary} />
        </View>

        <AppText raw variant="heading2" weight="semibold" style={{ color: colors.foreground, textAlign: 'center' }}>
          Shopee Live
        </AppText>

        <AppText
          raw
          variant="body"
          color="muted"
          style={{ textAlign: 'center', lineHeight: 22 }}>
          {t('live.comingSoon.message')}
        </AppText>
      </View>
    </SafeAreaView>
  )
}

