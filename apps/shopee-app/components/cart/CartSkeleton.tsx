import React from 'react'
import { View } from 'react-native'
import { SkeletonLoader } from '@/components/ui'

export default function CartSkeleton() {
  return (
    <View className="gap-2 px-4 py-3">
      {[1, 2, 3].map((i) => (
        <View key={i} className="flex-row items-center gap-3 py-3">
          <SkeletonLoader width={20} height={20} borderRadius={4} />
          <SkeletonLoader width={72} height={72} borderRadius={8} />
          <View className="flex-1 gap-2">
            <SkeletonLoader width="90%" height={14} borderRadius={4} />
            <SkeletonLoader width="60%" height={14} borderRadius={4} />
            <SkeletonLoader width={120} height={32} borderRadius={8} />
          </View>
        </View>
      ))}
    </View>
  )
}
