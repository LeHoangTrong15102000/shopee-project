import React from 'react'
import { View } from 'react-native'
import { SkeletonLoader } from '@/components/ui'

export default function VoucherSkeleton() {
  return (
    <View className="gap-0">
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          className="mx-4 my-1 flex-row overflow-hidden rounded-lg border border-neutrals900">
          {/* Left accent bar placeholder */}
          <SkeletonLoader width={6} height={90} borderRadius={0} />

          {/* Content placeholder */}
          <View className="flex-1 flex-row items-center gap-3 px-3 py-3">
            <SkeletonLoader width={24} height={24} borderRadius={12} />

            <View className="flex-1 gap-2">
              <SkeletonLoader width="60%" height={16} borderRadius={4} />
              <SkeletonLoader width="50%" height={12} borderRadius={4} />
              <SkeletonLoader width="40%" height={12} borderRadius={4} />
            </View>

            <SkeletonLoader width={56} height={30} borderRadius={16} />
          </View>
        </View>
      ))}
    </View>
  )
}
