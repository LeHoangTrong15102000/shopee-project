import React, { useEffect } from 'react'
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { z } from 'zod'
import { AppText, AppInput, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useForm } from '@/hooks/useForm'
import { useAddresses, useCreateAddress, useUpdateAddress } from '@/hooks/useAddresses'
import { useToast } from '@/components/ui/ToastProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

const addressSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Số điện thoại phải gồm 10 chữ số'),
  street: z.string().min(1, 'Địa chỉ không được để trống'),
  ward: z.string().optional(),
  district: z.string().optional(),
  city: z.string().min(1, 'Tỉnh/thành phố không được để trống'),
})

type AddressFormData = z.infer<typeof addressSchema>

export default function AddressFormScreen() {
  const colors = useColors()
  const router = useRouter()
  const { showSuccess, showError } = useToast()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEditMode = !!id

  const { data: addressesData } = useAddresses()
  const { mutate: createAddress, isPending: isCreating } = useCreateAddress()
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress()

  const isLoading = isCreating || isUpdating

  const { register, handleSubmit, formState, reset } = useForm<AddressFormData>({
    validationSchema: addressSchema,
    defaultValues: {
      name: '',
      phone: '',
      street: '',
      ward: '',
      district: '',
      city: '',
    },
    mode: 'onBlur',
  })

  // Pre-fill in edit mode
  useEffect(() => {
    if (isEditMode && addressesData?.data) {
      const addr = addressesData.data.find((a: any) => a._id === id)
      if (addr) {
        reset({
          name: addr.name ?? '',
          phone: addr.phone ?? '',
          street: addr.street ?? '',
          ward: addr.ward ?? '',
          district: addr.district ?? '',
          city: addr.city ?? '',
        })
      }
    }
  }, [id, addressesData])

  const onSubmit = handleSubmit((data: AddressFormData) => {
    if (isEditMode) {
      updateAddress(
        { id: id!, body: data },
        {
          onSuccess: () => {
            showSuccess('Cập nhật địa chỉ thành công')
            router.back()
          },
          onError: () => showError('Cập nhật thất bại, thử lại sau'),
        }
      )
    } else {
      createAddress(data, {
        onSuccess: () => {
          showSuccess('Thêm địa chỉ thành công')
          router.back()
        },
        onError: () => showError('Thêm địa chỉ thất bại, thử lại sau'),
      })
    }
  })

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: isEditMode ? 'Sửa địa chỉ' : 'Thêm địa chỉ',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          <View className="gap-4">
            <AppInput
              label="Họ tên người nhận"
              placeholder="Nhập họ tên"
              required
              errorText={formState.errors.name?.message}
              {...register('name')}
            />

            <AppInput
              label="Số điện thoại"
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              required
              errorText={formState.errors.phone?.message}
              {...register('phone')}
            />

            <AppInput
              label="Số nhà, tên đường"
              placeholder="Nhập địa chỉ chi tiết"
              required
              errorText={formState.errors.street?.message}
              {...register('street')}
            />

            <AppInput
              label="Phường/Xã"
              placeholder="Nhập phường/xã"
              errorText={formState.errors.ward?.message}
              {...register('ward')}
            />

            <AppInput
              label="Quận/Huyện"
              placeholder="Nhập quận/huyện"
              errorText={formState.errors.district?.message}
              {...register('district')}
            />

            <AppInput
              label="Tỉnh/Thành phố"
              placeholder="Nhập tỉnh/thành phố"
              required
              errorText={formState.errors.city?.message}
              {...register('city')}
            />
          </View>

          <AppButton
            variant="primary"
            onPress={onSubmit}
            loading={isLoading}
            disabled={isLoading}
            className="mt-8">
            Lưu
          </AppButton>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
