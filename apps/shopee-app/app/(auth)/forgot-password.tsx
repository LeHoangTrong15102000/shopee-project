import React, { useState } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { CheckCircle } from 'lucide-react-native'
import { AppText, AppButton, AppInput } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useForgotPassword } from '@/hooks/useForgotPassword'
import { AppSpacing } from '@/config/colors'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const colors = useColors()
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { mutate: sendRequest, isPending } = useForgotPassword()

  const isValidEmail = EMAIL_REGEX.test(email.trim())

  const handleSubmit = () => {
    if (!isValidEmail) return
    sendRequest(email.trim(), {
      onSuccess: () => setSubmitted(true),
    })
  }

  if (submitted) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
        style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: AppSpacing.screenPaddingHorizontal,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}>
          <CheckCircle size={64} color="#fff" />
          <AppText raw variant="heading2" weight="bold" className="mt-4 text-center text-white">
            Đã gửi yêu cầu
          </AppText>
          <AppText raw variant="body" className="mt-3 text-center text-white/80">
            Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.
          </AppText>
          <AppButton
            variant="outline"
            onPress={() => router.replace('/(auth)/sign-in')}
            className="mt-8 w-full border-white/30"
            textClassname="text-white">
            Quay lại đăng nhập
          </AppButton>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
      style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: AppSpacing.screenPaddingHorizontal,
            paddingTop: insets.top + AppSpacing.screenPaddingVertical,
            paddingBottom: insets.bottom + AppSpacing.screenPaddingVertical,
          }}
          keyboardShouldPersistTaps="handled">
          <AppText raw variant="heading2" weight="bold" className="mb-2 text-white">
            Quên mật khẩu
          </AppText>
          <AppText raw variant="body" className="mb-6 text-white/70">
            Nhập email của bạn để nhận hướng dẫn đặt lại mật khẩu.
          </AppText>

          <AppInput
            label="Email"
            labelClassName="text-white/90"
            placeholder="email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
            value={email}
            onChangeText={setEmail}
            editable={!isPending}
          />

          <AppButton
            variant="primary"
            size="lg"
            onPress={handleSubmit}
            loading={isPending}
            disabled={!isValidEmail || isPending}
            className="mt-4 w-full">
            Gửi yêu cầu
          </AppButton>

          <AppButton
            variant="link"
            onPress={() => router.back()}
            className="mt-4 w-full"
            textClassname="text-white/80">
            Quay lại đăng nhập
          </AppButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}
