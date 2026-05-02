import React, { useRef, useState } from 'react'
import {
  View,
  FlatList,
  Dimensions,
  Modal,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
} from 'react-native'
import { X } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { useColors } from '@/hooks/useColors'
import { AppImage } from '@/components/ui'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

interface ImageGalleryProps {
  images: string[]
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const colors = useColors()
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(0)
  const [fullscreenVisible, setFullscreenVisible] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    if (index !== activeIndex) setActiveIndex(index)
  }

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true })
    setActiveIndex(index)
  }

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => `img-${i}`}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => setFullscreenVisible(true)}
            accessibilityRole="image"
            accessibilityLabel={t('a11y.productImage', { index: index + 1, total: images.length }) + ', tap to zoom'}>
            <AppImage
              source={{ uri: item }}
              style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
              contentFit="cover"
            />
          </TouchableOpacity>
        )}
      />

      {/* Pagination dots */}
      {images.length > 1 && (
        <View
          className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center gap-1.5"
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants">
          {images.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === activeIndex ? colors.primary : colors.neutrals400,
              }}
            />
          ))}
        </View>
      )}

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <FlatList
          data={images}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2 px-4"
          keyExtractor={(_, i) => `thumb-${i}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => scrollToIndex(index)}
              accessibilityRole="button"
              accessibilityLabel={t('a11y.viewThumbnail', { index: index + 1 })}
              style={{
                borderWidth: index === activeIndex ? 2 : 1,
                borderColor: index === activeIndex ? colors.primary : colors.neutrals700,
                borderRadius: 6,
                marginRight: 8,
              }}>
              <AppImage
                source={{ uri: item }}
                style={{ width: 48, height: 48, borderRadius: 4 }}
                contentFit="cover"
                accessible={false}
              />
            </TouchableOpacity>
          )}
        />
      )}

      {/* Fullscreen modal */}
      <Modal
        visible={fullscreenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenVisible(false)}
        accessibilityViewIsModal={true}
        accessibilityRole="dialog">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <TouchableOpacity
            onPress={() => setFullscreenVisible(false)}
            className="absolute right-4 top-14 z-10 rounded-full bg-black/50 p-2"
            accessibilityRole="button"
            accessibilityLabel={t('a11y.closeFullscreen')}>
            <X size={24} color={colors.foreground} />
          </TouchableOpacity>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={activeIndex}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            keyExtractor={(_, i) => `full-${i}`}
            renderItem={({ item, index }) => (
              <ScrollView
                style={{ width: SCREEN_WIDTH, flex: 1 }}
                contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                maximumZoomScale={3}
                minimumZoomScale={1}
                bouncesZoom={true}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}>
                <AppImage
                  source={{ uri: item }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                  contentFit="contain"
                  accessibilityLabel={t('a11y.productImage', { index: index + 1, total: images.length })}
                />
              </ScrollView>
            )}
          />
        </View>
      </Modal>
    </View>
  )
}
