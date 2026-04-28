import React from 'react'
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { AppText, AppInput, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useForm } from '@/hooks/useForm'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useToast } from '@/components/ui/ToastProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { AxiosError } from 'axios'
import { handleMutationError } from '@/utils/mutationErrorHandler'

type ChangePasswordFormData = {
  current_password: string
  new_password: string
  confirm_password: string
}

export default function ChangePasswordScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { showSuccess } = useToast()

  const changePasswordSchema = z
    .object({
      current_password: z.string().min(1, t('changePassword.validation.currentRequired')),
      new_password: z.string().min(8, t('changePassword.validation.newMinLength')),
      confirm_password: z.string().min(1, t('changePassword.validation.confirmRequired')),
    })
    .refine((data) => data.new_password === data.confirm_password, {
      message: t('changePassword.validation.confirmMismatch'),
      path: ['confirm_password'],
    })

  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const { register, handleSubmit, formState, setError } = useForm<ChangePasswordFormData>({
    validationSchema: changePasswordSchema,
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
    mode: 'onBlur',
  })

  const onSubmit = handleSubmit((data: ChangePasswordFormData) => {
    updateProfile(
      {
        password: data.current_password,
        new_password: data.new_password,
      },
      {
        onSuccess: () => {
          showSuccess(t('changePassword.toast.success'))
          router.back()
        },
        onError: (error: unknown) => {
          const message = (error as AxiosError<{ message?: string }>)?.response?.data?.message
          if (message?.includes('password')) {
            setError('current_password', {
              type: 'manual',
              message: t('changePassword.toast.incorrectPassword'),
            })
          } else {
            handleMutationError(error)
          }
        },
      }
    )
  })

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('changePassword.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <AppText raw variant="bodySmall" color="muted" className="mb-6">
            {t('changePassword.hint.minLength')}
          </AppText>

          <View className="gap-4">
            <AppInput
              label={t('changePassword.field.currentLabel')}
              placeholder={t('changePassword.field.currentPlaceholder')}
              secureTextEntry
              errorText={formState.errors.current_password?.message}
              {...register('current_password')}
            />

            <AppInput
              label={t('changePassword.field.newLabel')}
              placeholder={t('changePassword.field.newPlaceholder')}
              secureTextEntry
              errorText={formState.errors.new_password?.message}
              {...register('new_password')}
            />

            <AppInput
              label={t('changePassword.field.confirmLabel')}
              placeholder={t('changePassword.field.confirmPlaceholder')}
              secureTextEntry
              errorText={formState.errors.confirm_password?.message}
              {...register('confirm_password')}
            />
          </View>

          <AppButton
            variant="primary"
            onPress={onSubmit}
            loading={isPending}
            disabled={isPending}
            className="mt-8">
            {t('changePassword.button.submit')}
          </AppButton>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
