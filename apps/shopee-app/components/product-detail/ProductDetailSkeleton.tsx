import React from 'react'
import { View, Dimensions } from 'react-native'
import { SkeletonLoader } from '@/components/ui'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

export default function ProductDetailSkeleton() {
  return (
    <View className="flex-1">
      {/* Image skeleton */}
      <SkeletonLoader width={SCREEN_WIDTH} height={SCREEN_WIDTH} borderRadius={0} />

      {/* Thumbnail strip */}
      <View className="mt-2 flex-row gap-2 px-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonLoader key={i} width={48} height={48} borderRadius={6} />
        ))}
      </View>

      {/* Price */}
      <View className="mt-4 px-4">
        <SkeletonLoader width={160} height={28} borderRadius={4} />
      </View>

      {/* Product name */}
      <View className="mt-3 gap-2 px-4">
        <SkeletonLoader width="100%" height={18} borderRadius={4} />
        <SkeletonLoader width="70%" height={18} borderRadius={4} />
      </View>

      {/* Rating row */}
      <View className="mt-3 flex-row gap-3 px-4">
        <SkeletonLoader width={60} height={16} borderRadius={4} />
        <SkeletonLoader width={80} height={16} borderRadius={4} />
        <SkeletonLoader width={80} height={16} borderRadius={4} />
      </View>

      {/* Quantity selector */}
      <View className="mt-4 flex-row items-center justify-between px-4">
        <SkeletonLoader width={100} height={16} borderRadius={4} />
        <SkeletonLoader width={120} height={36} borderRadius={8} />
      </View>

      {/* Description */}
      <View className="mt-4 gap-2 px-4">
        <SkeletonLoader width={100} height={20} borderRadius={4} />
        <SkeletonLoader width="100%" height={14} borderRadius={4} />
        <SkeletonLoader width="100%" height={14} borderRadius={4} />
        <SkeletonLoader width="60%" height={14} borderRadius={4} />
      </View>

      {/* Reviews section */}
      <View className="mt-4 gap-2 px-4">
        <SkeletonLoader width={80} height={20} borderRadius={4} />
        <SkeletonLoader width="100%" height={80} borderRadius={8} />
      </View>
    </View>
  )
}
