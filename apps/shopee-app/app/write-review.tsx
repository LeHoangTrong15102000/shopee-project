import React, { useState } from 'react'
import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Star, X, ImagePlus } from 'lucide-react-native'
import { AppText, AppButton, AppInput } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useSubmitShopReview } from '@/hooks/useSubmitShopReview'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function WriteReviewScreen() {
  const colors = useColors()
  const router = useRouter()
  const { productName, productId, orderId } = useLocalSearchParams<{
    productId: string
    orderId: string
    productName: string
  }>()

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [images, setImages] = useState<string[]>([])

  const { mutate: submitReview, isPending } = useSubmitShopReview()

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh để chọn ảnh.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    })
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri)
      setImages((prev) => [...prev, ...uris].slice(0, 5))
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!rating || !productId || !orderId) return
    submitReview(
      { productId, orderId, rating, comment, images: images.length > 0 ? images : undefined },
      { onSuccess: () => router.back() }
    )
  }

  const canSubmit = rating > 0 && !isPending

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Viết đánh giá',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          {/* Product name */}
          <AppText raw variant="body" weight="semibold" className="mb-4">
            {productName}
          </AppText>

          {/* Star picker */}
          <View className="mb-4">
            <AppText raw variant="bodySmall" color="muted" className="mb-2">
              Đánh giá của bạn
            </AppText>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  accessibilityRole="button"
                  accessibilityLabel={`${star} sao`}>
                  <Star
                    size={36}
                    color={star <= rating ? '#F97316' : colors.neutrals600}
                    fill={star <= rating ? '#F97316' : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comment input */}
          <View className="mb-4">
            <AppInput
              label="Nhận xét"
              variant="textarea"
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
              value={comment}
              onChangeText={setComment}
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Image picker */}
          <View className="mb-6">
            <AppText raw variant="bodySmall" color="muted" className="mb-2">
              Hình ảnh ({images.length}/5)
            </AppText>
            <View className="flex-row flex-wrap gap-2">
              {images.map((uri, index) => (
                <View key={uri} style={{ position: 'relative' }}>
                  <Image
                    source={{ uri }}
                    style={{ width: 72, height: 72, borderRadius: 8 }}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={() => handleRemoveImage(index)}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      backgroundColor: colors.error,
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Xóa ảnh">
                    <X size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && (
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: colors.neutrals700,
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Thêm ảnh">
                  <ImagePlus size={24} color={colors.neutrals600} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <AppButton
            variant="primary"
            onPress={handleSubmit}
            disabled={!canSubmit}
            loading={isPending}
            className="w-full">
            Gửi đánh giá
          </AppButton>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
