import React, { useEffect, useState } from 'react'
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter } from 'expo-router'
import { Camera } from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'
import DateTimePicker from '@react-native-community/datetimepicker'
import { z } from 'zod'
import { AppText, AppInput, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useForm } from '@/hooks/useForm'
import { useProfile, useUpdateProfile, useUploadAvatar } from '@/hooks/useProfile'
import { useToast } from '@/components/ui/ToastProvider'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

const profileSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống'),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'Số điện thoại phải gồm 10 chữ số')
    .or(z.literal('')),
  address: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export default function ProfileEditScreen() {
  const colors = useColors()
  const router = useRouter()
  const { showSuccess, showError } = useToast()

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
      showError('Cần quyền truy cập thư viện ảnh')
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
      } as any)
      uploadAvatar(formData, {
        onError: () => {
          showError('Tải ảnh lên thất bại')
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
          showSuccess('Cập nhật hồ sơ thành công')
          router.back()
        },
        onError: () => {
          showError('Cập nhật thất bại, thử lại sau')
        },
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
          title: 'Sửa hồ sơ',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          {/* Avatar */}
          <View className="mb-6 items-center">
            <TouchableOpacity onPress={handlePickAvatar} disabled={isUploadingAvatar}>
              <View style={{ position: 'relative' }}>
                {avatarSource ? (
                  <Image
                    source={avatarSource}
                    style={{ width: 96, height: 96, borderRadius: 48 }}
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
                    <AppText raw variant="heading1" style={{ color: '#fff' }}>
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
                    <Camera size={16} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <AppText raw variant="bodySmall" color="muted" style={{ marginTop: 8 }}>
              Nhấn để thay đổi ảnh đại diện
            </AppText>
          </View>

          {/* Form Fields */}
          <View className="gap-4">
            <AppInput
              label="Tên"
              placeholder="Nhập tên của bạn"
              required
              errorText={formState.errors.name?.message}
              {...register('name')}
            />

            <AppInput
              label="Số điện thoại"
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              errorText={formState.errors.phone?.message}
              {...register('phone')}
            />

            <AppInput
              label="Địa chỉ"
              placeholder="Nhập địa chỉ"
              errorText={formState.errors.address?.message}
              {...register('address')}
            />

            {/* Date of Birth */}
            <View>
              <AppText raw variant="body" weight="medium" className="mb-1.5">
                Ngày sinh
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
                    : 'Chọn ngày sinh'}
                </AppText>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={dateOfBirth ?? new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                onChange={(_event: any, selectedDate?: Date) => {
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
                Xong
              </AppButton>
            )}
          </View>

          <AppButton
            variant="primary"
            onPress={onSubmit}
            loading={isUpdating}
            disabled={isUpdating || isUploadingAvatar}
            className="mt-8">
            Lưu
          </AppButton>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
