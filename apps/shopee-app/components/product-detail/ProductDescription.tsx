import React, { useState } from 'react'
import { View, TouchableOpacity, NativeSyntheticEvent, TextLayoutEventData } from 'react-native'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useTranslation } from 'react-i18next'

interface ProductDescriptionProps {
  description: string
}

export default function ProductDescription({ description }: ProductDescriptionProps) {
  const colors = useColors()
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)

  return (
    <View className="px-4 py-3">
      <AppText raw variant="heading4" weight="bold" className="mb-2">
        {t('PD_DESCRIPTION')}
      </AppText>
      <AppText
        raw
        variant="bodySmall"
        color="muted"
        numberOfLines={expanded ? undefined : 4}
        onTextLayout={(e: NativeSyntheticEvent<TextLayoutEventData>) => {
          if (e.nativeEvent.lines.length > 4 && !needsTruncation) {
            setNeedsTruncation(true)
          }
        }}>
        {description}
      </AppText>
      {needsTruncation && (
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? t('PD_SHOW_LESS') : t('PD_SHOW_MORE')}
          className="mt-1">
          <AppText raw variant="bodySmall" style={{ color: colors.primary }}>
            {expanded ? t('PD_SHOW_LESS') : t('PD_SHOW_MORE')}
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  )
}
