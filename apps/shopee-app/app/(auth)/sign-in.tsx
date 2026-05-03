import React, { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useTranslation } from 'react-i18next'
import { useForm } from '@/hooks/useForm'
import { signInSchema, SignInFormData } from '@/schemas/auth.schema'
import { FormField, FormItem, FormMessage } from '@/components/ui/Form'
import AppInput from '@/components/ui/AppInput'
import AppButton from '@/components/ui/AppButton'
import { AppText, Icon } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useToast } from '@/components/ui/ToastProvider'
import { useAuthStore } from '@/store/authStore'
import authApi from '@/apis/auth.api'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppSpacing } from '@/config/colors'
import { AxiosError } from 'axios'

export default function SignInScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { showError, showInfo } = useToast()
  const colors = useColors()
  const login = useAuthStore((state) => state.login)
  const [loading, setLoading] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const passwordRef = useRef<TextInput>(null)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  const { handleSubmit, control } = useForm<SignInFormData>({
    defaultValues: { email: '', password: '' },
    validationSchema: signInSchema,
  })

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true)
    try {
      const res = await authApi.loginAccount({ email: data.email, password: data.password })
      const { access_token, refresh_token, user } = res.data.data
      login({ accessToken: access_token, refreshToken: refresh_token, user })
      router.replace('/(tabs)/home')
    } catch (error: unknown) {
      const message = (error as AxiosError<{ message?: string }>)?.response?.data?.message
      showError(t('AUTH_LOGIN_ERROR'), message)
    } finally {
      setLoading(false)
    }
  })

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
          {/* Logo / Title */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(600)}
            className="mb-8 items-center">
            <AppText variant="display3" weight="bold" className="text-white" raw>
              Shopee
            </AppText>
            <AppText variant="body" className="mt-2 text-white/70">
              {t('AUTH_SIGN_IN_TITLE')}
            </AppText>
          </Animated.View>

          {/* Email Field */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(200).duration(600)}>
            <FormField
              control={control}
              name="email"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AppInput
                    label={t('AUTH_EMAIL_LABEL')}
                    labelClassName="text-white/90"
                    placeholder="email@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    value={field.value}
                    onChangeText={field.onChangeText}
                    onBlur={field.onBlur}
                    errorText={fieldState.error?.message}
                    editable={!loading}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Animated.View>

          {/* Password Field */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(300).duration(600)}>
            <FormField
              control={control}
              name="password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AppInput
                    ref={passwordRef}
                    label={t('AUTH_PASSWORD_LABEL')}
                    labelClassName="text-white/90"
                    placeholder="••••••••"
                    secureTextEntry
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                    value={field.value}
                    onChangeText={field.onChangeText}
                    onBlur={field.onBlur}
                    errorText={fieldState.error?.message}
                    editable={!loading}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <View className="mt-1 items-end">
              <AppButton
                variant="link"
                onPress={() => router.push('/(auth)/forgot-password')}
                className="min-h-[36px] px-0"
                textClassname="text-white/70"
                accessibilityRole="link"
                accessibilityLabel={t('auth.forgotPassword')}>
                {t('auth.forgotPassword')}
              </AppButton>
            </View>
          </Animated.View>

          {/* Sign In Button */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(600)}
            className="mt-2">
            <AppButton
              variant="primary"
              size="lg"
              onPress={onSubmit}
              loading={loading}
              disabled={loading}
              className="w-full"
              accessibilityRole="button"
              accessibilityLabel={t('AUTH_SIGN_IN_BUTTON')}>
              {t('AUTH_SIGN_IN_BUTTON')}
            </AppButton>
          </Animated.View>

          {/* Google Sign-In Placeholder */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(500).duration(600)}
            className="mt-4">
            <AppButton
              variant="outline"
              size="lg"
              onPress={() => showInfo(t('AUTH_COMING_SOON'))}
              className="w-full border-white/30"
              textClassname="text-white"
              icon={<Icon name="Chrome" className="h-5 w-5 text-white" />}
              accessibilityRole="button"
              accessibilityLabel={t('AUTH_GOOGLE_SIGN_IN')}>
              {t('AUTH_GOOGLE_SIGN_IN')}
            </AppButton>
          </Animated.View>

          {/* Sign Up Link */}
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.delay(600).duration(600)}
            className="mt-6 flex-row items-center justify-center">
            <AppText variant="body" className="text-white/70">
              {t('AUTH_NO_ACCOUNT')}{' '}
            </AppText>
            <AppButton
              variant="link"
              onPress={() => router.push('/(auth)/sign-up')}
              className="min-h-[44px] px-2"
              textClassname="text-primary"
              accessibilityRole="link"
              accessibilityLabel={t('AUTH_SIGN_UP_LINK')}>
              {t('AUTH_SIGN_UP_LINK')}
            </AppButton>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  )
}
