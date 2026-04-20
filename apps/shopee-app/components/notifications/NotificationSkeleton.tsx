import React from 'react'
import { View } from 'react-native'
import { SkeletonLoader } from '@/components/ui'

export default function NotificationSkeleton() {
  return (
    <View className="gap-0">
      {[1, 2, 3, 4, 5].map((i) => (
        <View key={i} className="flex-row items-start gap-3 px-4 py-3">
          <View style={{ paddingTop: 6 }}>
            <SkeletonLoader width={8} height={8} borderRadius={4} />
          </View>
          <View className="flex-1 gap-2">
            <SkeletonLoader width="70%" height={14} borderRadius={4} />
            <SkeletonLoader width="100%" height={12} borderRadius={4} />
            <SkeletonLoader width="40%" height={10} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  )
}
