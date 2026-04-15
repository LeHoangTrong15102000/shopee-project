import React from 'react'
import { View, Dimensions } from 'react-native'
import { SkeletonLoader } from '@/components/ui'
import { CARD_WIDTH } from './ProductCard'

const SCREEN_WIDTH = Dimensions.get('window').width

export function BannerSkeleton() {
  return <SkeletonLoader width={SCREEN_WIDTH} height={SCREEN_WIDTH * 0.45} borderRadius={0} />
}

export function CategorySkeleton() {
  return (
    <View className="flex-row gap-2 px-4 py-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonLoader key={i} width={72} height={32} borderRadius={16} />
      ))}
    </View>
  )
}

export function ProductCardSkeleton() {
  return (
    <View style={{ width: CARD_WIDTH }} className="overflow-hidden rounded-lg">
      <SkeletonLoader width={CARD_WIDTH} height={CARD_WIDTH} borderRadius={0} />
      <View className="gap-2 p-2">
        <SkeletonLoader width={CARD_WIDTH - 16} height={14} borderRadius={4} />
        <SkeletonLoader width={80} height={14} borderRadius={4} />
        <SkeletonLoader width={60} height={12} borderRadius={4} />
      </View>
    </View>
  )
}
