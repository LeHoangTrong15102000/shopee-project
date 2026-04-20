import React from 'react'
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { z } from 'zod'
import { AppText, AppInput, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useForm } from '@/hooks/useForm'
import { useUpdateProfile } from '@/hooks/useProfile'
import { useToast } from '@/components/ui/ToastProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    new_password: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự'),
    confirm_password: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirm_password'],
  })

type ChangePasswordFormData = {
  current_password: string
  new_password: string
  confirm_password: string
}

export default function ChangePasswordScreen() {
  const colors = useColors()
  const router = useRouter()
  const { showSuccess, showError } = useToast()

  const { mutate: updateProfile, isPending } = useUpdateProfile()

  const { register, handleSubmit, formState, setError } = useForm<ChangePasswordFormData>({
    validationSchema: changePasswordSchema as any,
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
          showSuccess('Đổi mật khẩu thành công')
          router.back()
        },
        onError: (error: any) => {
          const message = error?.response?.data?.message
          if (message?.includes('password')) {
            setError('current_password', {
              type: 'manual',
              message: 'Mật khẩu hiện tại không đúng',
            })
          } else {
            showError('Đổi mật khẩu thất bại, thử lại sau')
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
          title: 'Đổi mật khẩu',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <AppText raw variant="bodySmall" color="muted" className="mb-6">
            Mật khẩu mới phải có ít nhất 8 ký tự
          </AppText>

          <View className="gap-4">
            <AppInput
              label="Mật khẩu hiện tại"
              placeholder="Nhập mật khẩu hiện tại"
              secureTextEntry
              errorText={formState.errors.current_password?.message}
              {...register('current_password')}
            />

            <AppInput
              label="Mật khẩu mới"
              placeholder="Nhập mật khẩu mới"
              secureTextEntry
              errorText={formState.errors.new_password?.message}
              {...register('new_password')}
            />

            <AppInput
              label="Xác nhận mật khẩu mới"
              placeholder="Nhập lại mật khẩu mới"
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
            Đổi mật khẩu
          </AppButton>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
