import React, { useState } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton } from '@/components/ui'
import AppInput from '@/components/ui/AppInput'
import { useColors } from '@/hooks/useColors'
import { useSubmitRefund } from '@/hooks/useRefund'
import { type RefundReason } from '@/apis/refund.api'
import { isAxiosError } from 'axios'
import { toast } from '@/utils/toast'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RefundRequestFormProps {
  orderId: string
  orderTotal: number
  onSuccess?: () => void
}

// ─── Validation ───────────────────────────────────────────────────────────────

const REFUND_REASONS: RefundReason[] = [
  'DEFECTIVE',
  'WRONG_ITEM',
  'NOT_AS_DESCRIBED',
  'CHANGED_MIND',
  'OTHER',
]

const MAX_EVIDENCE = 5

interface FormErrors {
  reason?: string
  reason_detail?: string
  evidence?: string
  requested_amount?: string
}

function validate(
  reason: RefundReason | '',
  reasonDetail: string,
  evidence: string[],
  requestedAmount: string,
  t: (key: string) => string,
): FormErrors {
  const errors: FormErrors = {}

  if (!reason) {
    errors.reason = t('refund.validation.reasonRequired')
  }
  if (!reasonDetail.trim()) {
    errors.reason_detail = t('refund.validation.detailRequired')
  }
  if (evidence.length > MAX_EVIDENCE) {
    errors.evidence = t('refund.validation.evidenceMax')
  }
  const amount = parseFloat(requestedAmount)
  if (!requestedAmount || isNaN(amount) || amount <= 0) {
    errors.requested_amount = t('refund.validation.amountPositive')
  }
  return errors
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RefundRequestForm({ orderId, orderTotal, onSuccess }: RefundRequestFormProps) {
  const { t } = useTranslation()
  const colors = useColors()

  const [reason, setReason] = useState<RefundReason | ''>('')
  const [reasonDetail, setReasonDetail] = useState('')
  const [evidenceInput, setEvidenceInput] = useState('')
  const [evidence, setEvidence] = useState<string[]>([])
  const [requestedAmount, setRequestedAmount] = useState(String(orderTotal))
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState<string | null>(null)

  const submitRefund = useSubmitRefund(orderId)

  const handleAddEvidence = () => {
    const url = evidenceInput.trim()
    if (!url) return
    if (evidence.length >= MAX_EVIDENCE) {
      setErrors((prev) => ({ ...prev, evidence: t('refund.validation.evidenceMax') }))
      return
    }
    // Basic URL validation
    try {
      new URL(url)
    } catch {
      setErrors((prev) => ({ ...prev, evidence: t('refund.validation.evidenceUrl') }))
      return
    }
    setEvidence((prev) => [...prev, url])
    setEvidenceInput('')
    setErrors((prev) => ({ ...prev, evidence: undefined }))
  }

  const handleRemoveEvidence = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    setServerError(null)
    const formErrors = validate(reason, reasonDetail, evidence, requestedAmount, t)
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors)
      return
    }
    setErrors({})

    submitRefund.mutate(
      {
        reason: reason as RefundReason,
        reason_detail: reasonDetail.trim(),
        evidence,
        requested_amount: parseFloat(requestedAmount),
      },
      {
        onSuccess: () => {
          toast.success(t('refund.toast.submitSuccess'))
          onSuccess?.()
        },
        onError: (error) => {
          // Surface server error and keep form editable
          if (isAxiosError(error)) {
            const msg = (error.response?.data as { message?: string } | undefined)?.message
            if (msg) {
              setServerError(msg)
              return
            }
          }
          setServerError(t('refund.error.submitFailed'))
        },
      },
    )
  }

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Reason picker */}
      <View>
        <AppText raw variant="bodySmall" weight="semibold" className="mb-2">
          {t('refund.form.reason')} *
        </AppText>
        <View style={{ gap: 8 }}>
          {REFUND_REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => {
                setReason(r)
                setErrors((prev) => ({ ...prev, reason: undefined }))
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: reason === r }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: reason === r ? colors.primary : colors.neutrals800,
                backgroundColor: reason === r ? `${colors.primary}15` : colors.background,
              }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 2,
                  borderColor: reason === r ? colors.primary : colors.neutrals600,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                {reason === r && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.primary,
                    }}
                  />
                )}
              </View>
              <AppText raw variant="bodySmall">
                {t(`refund.reason.${r}`)}
              </AppText>
            </TouchableOpacity>
          ))}
        </View>
        {errors.reason && (
          <AppText
            raw
            variant="labelSmall"
            color="error"
            className="mt-1"
            accessibilityRole="alert">
            {errors.reason}
          </AppText>
        )}
      </View>

      {/* Detail input */}
      <AppInput
        label={t('refund.form.detail')}
        required
        variant="textarea"
        placeholder={t('refund.form.detailPlaceholder')}
        value={reasonDetail}
        onChangeText={(text) => {
          setReasonDetail(text)
          if (text.trim()) setErrors((prev) => ({ ...prev, reason_detail: undefined }))
        }}
        errorText={errors.reason_detail}
      />

      {/* Evidence image URLs */}
      <View>
        <AppText raw variant="bodySmall" weight="semibold" className="mb-2">
          {t('refund.form.evidence')} ({evidence.length}/{MAX_EVIDENCE})
        </AppText>
        {evidence.map((url, index) => (
          <View
            key={index}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 6,
              gap: 8,
            }}>
            <AppText
              raw
              variant="labelSmall"
              color="muted"
              style={{ flex: 1 }}
              numberOfLines={1}>
              {url}
            </AppText>
            <TouchableOpacity
              onPress={() => handleRemoveEvidence(index)}
              accessibilityRole="button"
              accessibilityLabel={t('refund.form.removeEvidence')}>
              <AppText raw variant="labelSmall" color="error">
                ✕
              </AppText>
            </TouchableOpacity>
          </View>
        ))}
        {evidence.length < MAX_EVIDENCE && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <AppInput
              containerClassName="flex-1"
              placeholder={t('refund.form.evidencePlaceholder')}
              value={evidenceInput}
              onChangeText={setEvidenceInput}
              errorText={errors.evidence}
              keyboardType="url"
              autoCapitalize="none"
            />
            <AppButton variant="outline" size="sm" onPress={handleAddEvidence}>
              {t('refund.form.addEvidence')}
            </AppButton>
          </View>
        )}
      </View>

      {/* Requested amount */}
      <AppInput
        label={t('refund.form.amount')}
        required
        placeholder={t('refund.form.amountPlaceholder')}
        value={requestedAmount}
        onChangeText={(text) => {
          setRequestedAmount(text)
          if (parseFloat(text) > 0) setErrors((prev) => ({ ...prev, requested_amount: undefined }))
        }}
        errorText={errors.requested_amount}
        keyboardType="decimal-pad"
      />

      {/* Server error */}
      {serverError && (
        <AppText
          raw
          variant="bodySmall"
          color="error"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite">
          {serverError}
        </AppText>
      )}

      <AppButton
        variant="primary"
        onPress={handleSubmit}
        loading={submitRefund.isPending}
        className="w-full">
        {t('refund.form.submit')}
      </AppButton>
    </ScrollView>
  )
}
