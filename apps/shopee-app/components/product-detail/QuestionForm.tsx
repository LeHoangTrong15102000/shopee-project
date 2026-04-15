import React, { useCallback, useState } from 'react'
import { View, TextInput } from 'react-native'
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useTranslation } from 'react-i18next'
import { validateQuestionText, validateAnswerText } from '@/schemas/product-detail.schema'

interface QuestionFormProps {
  mode: 'ask' | 'answer'
  questionContext?: string
  onSubmit: (text: string) => void
  loading?: boolean
  bottomSheetRef: React.RefObject<BottomSheetModal | null>
}

export default function QuestionForm({
  mode,
  questionContext,
  onSubmit,
  loading,
  bottomSheetRef,
}: QuestionFormProps) {
  const colors = useColors()
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const isAnswer = mode === 'answer'
  const minLengthKey = isAnswer ? 'PD_ANSWER_MIN_LENGTH' : 'PD_QUESTION_MIN_LENGTH'
  const placeholderKey = isAnswer ? 'PD_ANSWER_PLACEHOLDER' : 'PD_QUESTION_PLACEHOLDER'
  const submitKey = isAnswer ? 'PD_ANSWER_SUBMIT' : 'PD_QUESTION_SUBMIT'
  const titleKey = isAnswer ? 'PD_ANSWER' : 'PD_ASK_QUESTION'

  const handleSubmit = () => {
    const isValid = isAnswer ? validateAnswerText(text) : validateQuestionText(text)
    if (!isValid) {
      setError(t(minLengthKey))
      return
    }
    setError('')
    onSubmit(text.trim())
  }

  const resetForm = useCallback(() => {
    setText('')
    setError('')
  }, [])

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      enableDynamicSizing
      backgroundStyle={{ backgroundColor: colors.background }}
      handleIndicatorStyle={{ backgroundColor: colors.neutrals400 }}
      onDismiss={resetForm}>
      <BottomSheetView
        className="px-4 pb-8"
        accessibilityViewIsModal={true}
        accessibilityRole="dialog">
        <AppText raw variant="heading4" weight="bold" className="mb-4">
          {t(titleKey)}
        </AppText>

        {isAnswer && questionContext && (
          <View className="mb-3 rounded-lg p-3" style={{ backgroundColor: colors.neutrals800 }}>
            <AppText raw variant="bodySmall" color="muted">
              {questionContext}
            </AppText>
          </View>
        )}

        <TextInput
          value={text}
          onChangeText={(val) => {
            setText(val)
            if (error) setError('')
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t(placeholderKey)}
          placeholderTextColor={colors.neutrals400}
          multiline
          numberOfLines={4}
          style={{
            backgroundColor: colors.neutrals800,
            color: colors.foreground,
            borderRadius: 12,
            padding: 12,
            minHeight: 100,
            textAlignVertical: 'top',
            borderWidth: 1,
            borderColor: isFocused ? colors.primary : colors.neutrals700,
          }}
          accessibilityLabel={t(titleKey)}
        />
        {error ? (
          <AppText raw variant="labelSmall" color="error" className="mt-1">
            {error}
          </AppText>
        ) : null}

        <View className="mt-4">
          <AppButton variant="primary" onPress={handleSubmit} loading={loading} disabled={loading}>
            {t(submitKey)}
          </AppButton>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
}
