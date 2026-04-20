import React from 'react'
import { View } from 'react-native'
import { SkeletonLoader } from '@/components/ui'

export default function OrderSkeleton() {
  return (
    <View className="gap-0">
      {[1, 2, 3].map((i) => (
        <View key={i} className="border-b border-neutrals900 px-4 py-3">
          <View className="mb-2 flex-row items-center justify-between">
            <SkeletonLoader width={100} height={12} borderRadius={4} />
            <SkeletonLoader width={80} height={20} borderRadius={10} />
          </View>
          <View className="flex-row gap-3">
            <SkeletonLoader width={56} height={56} borderRadius={8} />
            <View className="flex-1 gap-2">
              <SkeletonLoader width="80%" height={14} borderRadius={4} />
              <SkeletonLoader width="40%" height={12} borderRadius={4} />
            </View>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <SkeletonLoader width={60} height={12} borderRadius={4} />
            <SkeletonLoader width={100} height={16} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  )
}
