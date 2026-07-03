import React, { useState } from 'react'
import { View, ScrollView, TouchableOpacity, Image, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Star, X, ImagePlus } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, AppButton, AppInput } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useSubmitShopReview } from '@/hooks/useSubmitShopReview'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function WriteReviewScreen() {
  const { t } = useTranslation()
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
      Alert.alert(t('writeReview.permissionTitle'), t('writeReview.permissionMessage'))
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
      { purchaseId: orderId, rating, comment, images: images.length > 0 ? images : undefined },
      { onSuccess: () => router.back() }
    )
  }

  const canSubmit = rating > 0 && !isPending

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('writeReview.title'),
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
              {t('writeReview.ratingLabel')}
            </AppText>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  accessibilityRole="button"
                  accessibilityLabel={t('writeReview.a11y.starRating', { count: star })}>
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
              label={t('writeReview.commentLabel')}
              variant="textarea"
              placeholder={t('writeReview.commentPlaceholder')}
              value={comment}
              onChangeText={setComment}
              style={{ minHeight: 100 }}
            />
          </View>

          {/* Image picker */}
          <View className="mb-6">
            <AppText raw variant="bodySmall" color="muted" className="mb-2">
              {t('writeReview.imageCount', { count: images.length })}
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
                    accessibilityLabel={t('writeReview.a11y.removeImage')}>
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
                  accessibilityLabel={t('writeReview.a11y.addImage')}>
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
            {t('writeReview.submit')}
          </AppButton>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}
