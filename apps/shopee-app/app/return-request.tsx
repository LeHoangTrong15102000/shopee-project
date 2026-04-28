import React, { useState } from 'react'
import { View, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams } from 'expo-router'
import { CheckCircle, Circle } from 'lucide-react-native'
import { AppText, AppButton, AppInput } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useRequestReturn } from '@/hooks/useRequestReturn'
import { type ReturnReason } from '@/apis/order.api'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'damaged', label: 'Hàng bị hỏng' },
  { value: 'wrong_item', label: 'Sai sản phẩm' },
  { value: 'not_as_described', label: 'Không đúng mô tả' },
  { value: 'changed_mind', label: 'Đổi ý' },
  { value: 'other', label: 'Lý do khác' },
]

export default function ReturnRequestScreen() {
  const colors = useColors()
  const { orderId } = useLocalSearchParams<{ orderId: string }>()

  const [selectedReason, setSelectedReason] = useState<ReturnReason | null>(null)
  const [description, setDescription] = useState('')

  const { mutate: submitReturn, isPending } = useRequestReturn()

  const handleSubmit = () => {
    if (!selectedReason || !orderId) return
    submitReturn({
      orderId,
      payload: {
        reason: selectedReason,
        ...(description.trim() ? { description: description.trim() } : {}),
      },
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Yêu cầu trả hàng',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <AppText raw variant="body" weight="semibold" className="mb-3">
            Lý do trả hàng
          </AppText>

          {RETURN_REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              onPress={() => setSelectedReason(reason.value)}
              className="mb-2 flex-row items-center gap-3 rounded-xl border border-neutrals800 px-4 py-3"
              style={
                selectedReason === reason.value
                  ? { borderColor: colors.primary }
                  : undefined
              }
              accessibilityRole="radio"
              accessibilityState={{ checked: selectedReason === reason.value }}>
              {selectedReason === reason.value ? (
                <CheckCircle size={20} color={colors.primary} />
              ) : (
                <Circle size={20} color={colors.neutrals600} />
              )}
              <AppText raw variant="body">
                {reason.label}
              </AppText>
            </TouchableOpacity>
          ))}

          <View className="mt-4 mb-2">
            <AppInput
              label="Mô tả thêm (tuỳ chọn)"
              variant="textarea"
              placeholder="Mô tả chi tiết vấn đề của bạn..."
              value={description}
              onChangeText={setDescription}
              style={{ minHeight: 100 }}
            />
          </View>

          <AppButton
            variant="primary"
            onPress={handleSubmit}
            disabled={!selectedReason || isPending}
            loading={isPending}
            className="mt-4 w-full">
            Gửi yêu cầu
          </AppButton>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
