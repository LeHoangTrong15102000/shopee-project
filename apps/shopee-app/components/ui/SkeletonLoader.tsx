import React, { useEffect } from 'react'
import { View, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated'
import { useColors } from '@/hooks/useColors'

interface SkeletonLoaderProps {
  width: number | string
  height: number | string
  borderRadius?: number
  style?: ViewStyle
}

export default function SkeletonLoader({
  width,
  height,
  borderRadius = 4,
  style,
}: SkeletonLoaderProps) {
  const colors = useColors()
  const shimmer = useSharedValue(0)

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true)
  }, [shimmer])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.3, 0.7]),
  }))

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height: height as number,
          borderRadius,
          backgroundColor: colors.neutrals700,
        },
        animatedStyle,
        style,
      ]}
    />
  )
}
