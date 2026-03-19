import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, Image, Dimensions, ViewToken } from 'react-native';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const BANNERS = [
  { id: '1', image: 'https://cf.shopee.vn/file/e4a404283b3824c211c1c37f5b913174' },
  { id: '2', image: 'https://cf.shopee.vn/file/687f3967b7c2fe6a134a2c11e6199e40' },
  { id: '3', image: 'https://cf.shopee.vn/file/8e71245b9659ea2c3c765cf4d04a85ba' },
];

export default function BannerCarousel() {
  const colors = useColors();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % BANNERS.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4000);

    return () => clearInterval(timerRef.current);
  }, []);

  if (BANNERS.length === 0) return null;

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
          <Image
            source={{ uri: item.image }}
            style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.45 }}
            resizeMode="cover"
          />
        )}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        onScrollBeginDrag={() => clearInterval(timerRef.current)}
        onScrollEndDrag={() => {
          timerRef.current = setInterval(() => {
            setActiveIndex((prev) => {
              const next = (prev + 1) % BANNERS.length;
              flatListRef.current?.scrollToIndex({ index: next, animated: true });
              return next;
            });
          }, 4000);
        }}
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
  );
}
