import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { useForm } from '@/hooks/useForm';
import { signUpSchema, SignUpFormData } from '@/schemas/auth.schema';
import { FormField, FormItem, FormMessage } from '@/components/ui/Form';
import AppInput from '@/components/ui/AppInput';
import AppButton from '@/components/ui/AppButton';
import { AppText } from '@/components/ui';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import authApi from '@/apis/auth.api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppColors, AppSpacing } from '@/config/colors';
import { getPasswordStrength } from '@/utils/passwordStrength';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showError } = useToast();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const { handleSubmit, control, watch } = useForm<SignUpFormData>({
    defaultValues: { email: '', password: '', confirm_password: '' },
    validationSchema: signUpSchema,
  });

  const password = watch('password') || '';
  const strength = getPasswordStrength(password);

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const res = await authApi.registerAccount({ email: data.email, password: data.password });
      const { access_token, refresh_token, user } = res.data.data;
      login({ accessToken: access_token, refreshToken: refresh_token, user });
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const message = error?.response?.data?.message;
      showError(t('AUTH_REGISTER_ERROR'), message);
    } finally {
      setLoading(false);
    }
  });

  return (
    <LinearGradient
      colors={[AppColors.gradientStart, AppColors.gradientMiddle, AppColors.gradientEnd]}
      style={{ flex: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: AppSpacing.screenPaddingHorizontal,
            paddingTop: insets.top + AppSpacing.screenPaddingVertical,
            paddingBottom: insets.bottom + AppSpacing.screenPaddingVertical,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(100).duration(600)} className="items-center mb-8">
            <AppText variant="display3" weight="bold" className="text-white" raw>
              Shopee
            </AppText>
            <AppText variant="body" className="text-white/70 mt-2">
              {t('AUTH_SIGN_UP_TITLE')}
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
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    value={field.value}
                    onChangeText={field.onChangeText}
                    onBlur={field.onBlur}
                    errorText={fieldState.error?.message}
                    editable={!loading}
                  />
                  <FormMessage />
                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <View
                      className="mt-2"
                      accessibilityRole="progressbar"
                      accessibilityValue={{ min: 0, max: 100, now: strength.percent }}
                      accessibilityLabel={t(strength.level === 'weak' ? 'AUTH_PASSWORD_WEAK' : strength.level === 'medium' ? 'AUTH_PASSWORD_MEDIUM' : 'AUTH_PASSWORD_STRONG')}
                    >
                      <View className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                        <View
                          style={{ width: strength.width, backgroundColor: strength.color }}
                          className="h-full rounded-full"
                        />
                      </View>
                      <AppText variant="bodySmall" style={{ color: strength.color }} className="mt-1">
                        {t(strength.level === 'weak' ? 'AUTH_PASSWORD_WEAK' : strength.level === 'medium' ? 'AUTH_PASSWORD_MEDIUM' : 'AUTH_PASSWORD_STRONG')}
                      </AppText>
                    </View>
                  )}
                </FormItem>
              )}
            />
          </Animated.View>

          {/* Confirm Password Field */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(400).duration(600)}>
            <FormField
              control={control}
              name="confirm_password"
              render={({ field, fieldState }) => (
                <FormItem>
                  <AppInput
                    ref={confirmPasswordRef}
                    label={t('AUTH_CONFIRM_PASSWORD_LABEL')}
                    labelClassName="text-white/90"
                    placeholder="••••••••"
                    secureTextEntry
                    autoComplete="password-new"
                    textContentType="newPassword"
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
          </Animated.View>

          {/* Sign Up Button */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(500).duration(600)} className="mt-2">
            <AppButton
              variant="primary"
              size="lg"
              onPress={onSubmit}
              loading={loading}
              disabled={loading}
              className="w-full"
              accessibilityRole="button"
              accessibilityLabel={t('AUTH_SIGN_UP_BUTTON')}
            >
              {t('AUTH_SIGN_UP_BUTTON')}
            </AppButton>
          </Animated.View>

          {/* Sign In Link */}
          <Animated.View entering={reduceMotion ? undefined : FadeInDown.delay(600).duration(600)} className="flex-row justify-center items-center mt-6">
            <AppText variant="body" className="text-white/70">
              {t('AUTH_HAS_ACCOUNT')}{' '}
            </AppText>
            <AppButton
              variant="link"
              onPress={() => router.push('/(auth)/sign-in')}
              className="min-h-[44px] px-2"
              textClassname="text-primary"
              accessibilityRole="link"
              accessibilityLabel={t('AUTH_SIGN_IN_LINK')}
            >
              {t('AUTH_SIGN_IN_LINK')}
            </AppButton>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
