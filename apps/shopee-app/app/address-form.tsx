import React, { useEffect } from 'react'
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { AppText, AppInput, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useForm } from '@/hooks/useForm'
import { useAddresses, useCreateAddress, useUpdateAddress } from '@/hooks/useAddresses'
import { useToast } from '@/components/ui/ToastProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { Address } from '@/apis/address.api'
import { handleMutationError } from '@/utils/mutationErrorHandler'

type AddressFormData = {
  name: string
  phone: string
  street: string
  ward?: string
  district?: string
  city: string
}

export default function AddressFormScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { showSuccess } = useToast()
  const { id } = useLocalSearchParams<{ id?: string }>()
  const isEditMode = !!id

  const addressSchema = z.object({
    name: z.string().min(1, t('addressForm.validation.nameRequired')),
    phone: z.string().regex(/^[0-9]{10}$/, t('addressForm.validation.phoneInvalid')),
    street: z.string().min(1, t('addressForm.validation.streetRequired')),
    ward: z.string().optional(),
    district: z.string().optional(),
    city: z.string().min(1, t('addressForm.validation.cityRequired')),
  })

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
      const addr = addressesData.data.find((a: Address) => a._id === id)
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
            showSuccess(t('addressForm.toast.updateSuccess'))
            router.back()
          },
          onError: handleMutationError,
        }
      )
    } else {
      createAddress(data, {
        onSuccess: () => {
          showSuccess(t('addressForm.toast.createSuccess'))
          router.back()
        },
        onError: handleMutationError,
      })
    }
  })

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: isEditMode
            ? t('addressForm.header.editTitle')
            : t('addressForm.header.createTitle'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16 }}>
            <View className="gap-4">
              <AppInput
                label={t('addressForm.field.nameLabel')}
                placeholder={t('addressForm.field.namePlaceholder')}
                required
                errorText={formState.errors.name?.message}
                {...register('name')}
              />

              <AppInput
                label={t('addressForm.field.phoneLabel')}
                placeholder={t('addressForm.field.phonePlaceholder')}
                keyboardType="phone-pad"
                required
                errorText={formState.errors.phone?.message}
                {...register('phone')}
              />

              <AppInput
                label={t('addressForm.field.streetLabel')}
                placeholder={t('addressForm.field.streetPlaceholder')}
                required
                errorText={formState.errors.street?.message}
                {...register('street')}
              />

              <AppInput
                label={t('addressForm.field.wardLabel')}
                placeholder={t('addressForm.field.wardPlaceholder')}
                errorText={formState.errors.ward?.message}
                {...register('ward')}
              />

              <AppInput
                label={t('addressForm.field.districtLabel')}
                placeholder={t('addressForm.field.districtPlaceholder')}
                errorText={formState.errors.district?.message}
                {...register('district')}
              />

              <AppInput
                label={t('addressForm.field.cityLabel')}
                placeholder={t('addressForm.field.cityPlaceholder')}
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
              {t('addressForm.button.save')}
            </AppButton>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}
