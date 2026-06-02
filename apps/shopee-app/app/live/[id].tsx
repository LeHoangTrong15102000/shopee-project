import React, { useEffect, useRef, useState } from 'react'
import { FlatList, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { Video, ResizeMode } from 'expo-av'
import { ChevronLeft, Eye, Heart } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { useLiveStream } from '@/hooks/useLiveStream'
import { ProductSummary } from '@/types/live.type'

function DetailSkeleton() {
  const colors = useColors()
  return (
    <View style={{ flex: 1 }}>
      <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.neutrals700 }} />
      <View style={{ padding: 16, gap: 12 }}>
        <View
          style={{ height: 20, borderRadius: 4, backgroundColor: colors.neutrals700, width: '70%' }}
        />
        <View
          style={{ height: 14, borderRadius: 4, backgroundColor: colors.neutrals700, width: '40%' }}
        />
        <View
          style={{
            height: 100,
            borderRadius: 8,
            backgroundColor: colors.neutrals700,
            marginTop: 16,
          }}
        />
      </View>
    </View>
  )
}

export default function LiveStreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useTranslation()
  const router = useRouter()
  const colors = useColors()
  const { data: stream, isLoading } = useLiveStream(id || '')
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(128)
  const videoRef = useRef<Video>(null)

  useEffect(() => {
    return () => {
      videoRef.current?.unloadAsync()
    }
  }, [])

  const handleLike = () => {
    setLiked((prev) => !prev)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  const renderProduct = ({ item }: { item: ProductSummary }) => (
    <View style={{ width: 120, marginRight: 12 }}>
      <Image
        source={{ uri: item.image }}
        style={{ width: 120, height: 120, borderRadius: 8 }}
        contentFit="cover"
      />
      <AppText
        variant="caption"
        numberOfLines={2}
        style={{ marginTop: 4, color: colors.foreground }}>
        {item.name}
      </AppText>
      <AppText variant="caption" weight="semibold" style={{ color: colors.primary }}>
        {item.price.toLocaleString()}đ
      </AppText>
    </View>
  )

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <ChevronLeft size={24} color={colors.foreground} />
        </Pressable>
        <AppText
          variant="heading3"
          weight="semibold"
          style={{ flex: 1, marginLeft: 12, color: colors.foreground }}
          numberOfLines={1}>
          {stream?.title || t('live.title')}
        </AppText>
      </View>

      {isLoading ? (
        <DetailSkeleton />
      ) : stream ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Video Player */}
          <Video
            ref={videoRef}
            source={{ uri: stream.videoUrl }}
            posterSource={{ uri: stream.thumbnailUrl }}
            usePoster
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }}
          />

          {/* Stream Info */}
          <View style={{ padding: 16, gap: 12 }}>
            {/* Viewer count + Like */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Eye size={18} color={colors.neutrals100} />
                <AppText variant="body" color="muted">
                  {stream.viewerCount.toLocaleString()} {t('live.watching')}
                </AppText>
              </View>
              <Pressable
                onPress={handleLike}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                accessibilityRole="button"
                accessibilityLabel={liked ? 'Unlike' : 'Like'}>
                <Heart
                  size={22}
                  color={liked ? '#EF4444' : colors.neutrals100}
                  fill={liked ? '#EF4444' : 'none'}
                />
                <AppText variant="body" style={{ color: liked ? '#EF4444' : colors.neutrals100 }}>
                  {likeCount.toLocaleString()} {t('live.likes')}
                </AppText>
              </Pressable>
            </View>

            {/* Streamer info */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Image
                source={{ uri: stream.streamerAvatar }}
                style={{ width: 36, height: 36, borderRadius: 18 }}
              />
              <AppText variant="body" weight="semibold" style={{ color: colors.foreground }}>
                {stream.streamerName}
              </AppText>
            </View>

            {/* Featured Products */}
            {stream.featuredProducts.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <AppText
                  variant="body"
                  weight="semibold"
                  style={{ marginBottom: 12, color: colors.foreground }}>
                  {t('live.featuredProducts')}
                </AppText>
                <FlatList
                  data={stream.featuredProducts}
                  renderItem={renderProduct}
                  keyExtractor={(item) => item._id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                />
              </View>
            )}
          </View>
        </ScrollView>
      ) : null}
    </SafeAreaView>
  )
}
