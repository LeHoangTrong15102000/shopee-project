import React, { useCallback, useRef, useState } from 'react'
import { View, FlatList, Dimensions, ViewToken } from 'react-native'
import { useColors } from '@/hooks/useColors'
import { AppImage } from '@/components/ui'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

const BANNERS = [
  { id: '1', image: 'https://picsum.photos/seed/shopee1/800/360' },
  { id: '2', image: 'https://picsum.photos/seed/shopee2/800/360' },
  { id: '3', image: 'https://picsum.photos/seed/shopee3/800/360' },
]

export default function BannerCarousel() {
  const colors = useColors()
  const [activeIndex, setActiveIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index)
      }
    },
    []
  )

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current

  if (BANNERS.length === 0) return null

  return (
    <View>
      <FlatList
        ref={flatListRef}
        data={BANNERS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppImage
            source={{ uri: item.image }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.45 }}
            contentFit="cover"
          />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      <View className="flex-row items-center justify-center gap-1.5 py-2">
        {BANNERS.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === activeIndex ? 16 : 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i === activeIndex ? colors.primary : colors.neutrals500,
            }}
          />
        ))}
      </View>
    </View>
  )
}
