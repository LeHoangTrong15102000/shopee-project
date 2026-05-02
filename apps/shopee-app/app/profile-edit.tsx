import React, { useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { Camera } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { AppText, AppInput, AppButton, AppImage } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useForm } from '@/hooks/useForm'
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile'
import { useToast } from '@/components/ui/ToastProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { handleMutationError } from '@/utils/mutationErrorHandler'

type ProfileFormData = {
  name: string
  phone: string
  address?: string
}

export default function ProfileEditScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const { showSuccess } = useToast()

  const profileSchema = z.object({
    name: z.string().min(1, t('profileEdit.validation.nameRequired')),
    phone: z
      .string()
      .regex(/^[0-9]{10}$/, t('profileEdit.validation.phoneInvalid'))
      .or(z.literal('')),
    address: z.string().optional(),
  })

  const { data: profileData } = useProfile()
  const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile()
  const { mutate: uploadAvatar, isPending: isUploadingAvatar } = useUploadAvatar()

  const user = profileData?.data?.data

  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const { register, handleSubmit, formState, reset } = useForm<ProfileFormData>({
    validationSchema: profileSchema,
    defaultValues: {
      name: '',
      phone: '',
      address: '',
    },
    mode: 'onBlur',
  })

  useEffect(() => {
    if (user) {
      reset({
        name: user.name ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
      })
      if (user.date_of_birth) {
        setDateOfBirth(new Date(user.date_of_birth))
      }
    }
  }, [user])

  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permission.granted) {
      handleMutationError(new Error(t('profileEdit.toast.permissionDenied')))
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setAvatarUri(asset.uri)
      const formData = new FormData()
      formData.append('image', {
        uri: asset.uri,
        type: asset.mimeType ?? 'image/jpeg',
        name: 'avatar.jpg',
      } as unknown as Blob)
      uploadAvatar(formData, {
        onError: (error) => {
          handleMutationError(error)
          setAvatarUri(null)
        },
      })
    }
  }

  const onSubmit = handleSubmit((data: ProfileFormData) => {
    updateProfile(
      {
        name: data.name,
        phone: data.phone || undefined,
        address: data.address || undefined,
        date_of_birth: dateOfBirth?.toISOString(),
      },
      {
        onSuccess: () => {
          showSuccess(t('profileEdit.toast.success'))
          router.back()
        },
        onError: handleMutationError,
      }
    )
  })

  const avatarSource = avatarUri
    ? { uri: avatarUri }
    : user?.avatar
      ? { uri: user.avatar }
      : null

  const displayInitial = (user?.name || user?.email || 'U').charAt(0).toUpperCase()

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('profileEdit.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
          {/* Avatar */}
          <View className="mb-6 items-center">
            <TouchableOpacity onPress={handlePickAvatar} disabled={isUploadingAvatar}>
              <View style={{ position: 'relative' }}>
                {avatarSource ? (
                  <AppImage
                    source={avatarSource}
                    style={{ width: 96, height: 96, borderRadius: 48 }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <AppText raw variant="heading1" style={{ color: colors.primaryForeground }}>
                      {displayInitial}
                    </AppText>
                  </View>
                )}
                {isUploadingAvatar ? (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.neutrals800,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Camera size={16} color={colors.primaryForeground} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <AppText raw variant="bodySmall" color="muted" style={{ marginTop: 8 }}>
              {t('profileEdit.avatar.hint')}
            </AppText>
          </View>

          {/* Form Fields */}
          <View className="gap-4">
            <AppInput
              label={t('profileEdit.field.nameLabel')}
              placeholder={t('profileEdit.field.namePlaceholder')}
              required
              errorText={formState.errors.name?.message}
              {...register('name')}
            />

            <AppInput
              label={t('profileEdit.field.phoneLabel')}
              placeholder={t('profileEdit.field.phonePlaceholder')}
              keyboardType="phone-pad"
              errorText={formState.errors.phone?.message}
              {...register('phone')}
            />

            <AppInput
              label={t('profileEdit.field.addressLabel')}
              placeholder={t('profileEdit.field.addressPlaceholder')}
              errorText={formState.errors.address?.message}
              {...register('address')}
            />

            {/* Date of Birth */}
            <View>
              <AppText raw variant="body" weight="medium" className="mb-1.5">
                {t('profileEdit.field.birthdayLabel')}
              </AppText>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={{
                  borderWidth: 1,
                  borderColor: colors.neutrals900,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: colors.background,
                }}>
                <AppText raw variant="body" color={dateOfBirth ? 'foreground' : 'muted'}>
                  {dateOfBirth
                    ? dateOfBirth.toLocaleDateString('vi-VN')
                    : t('profileEdit.field.birthdayPlaceholder')}
                </AppText>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_event: DateTimePickerEvent, selectedDate?: Date) => {
                  setShowDatePicker(Platform.OS === 'ios')
                  if (selectedDate) {
                    setDateOfBirth(selectedDate)
                  }
                }}
              />
            )}

            {Platform.OS === 'ios' && showDatePicker && (
              <AppButton
                variant="outline"
                onPress={() => setShowDatePicker(false)}>
                {t('profileEdit.button.save')}
              </AppButton>
            )}
          </View>

          <AppButton
            variant="primary"
            onPress={onSubmit}
            loading={isUpdating}
            disabled={isUpdating || isUploadingAvatar}
            className="mt-8">
            {t('profileEdit.button.save')}
          </AppButton>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  )
}
