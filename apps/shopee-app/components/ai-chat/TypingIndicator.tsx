import React, { useEffect, useRef } from 'react'
import { View, Animated } from 'react-native'
import { useColors } from '@/hooks/useColors'

export default function TypingIndicator() {
  const colors = useColors()
  const dot1 = useRef(new Animated.Value(0)).current
  const dot2 = useRef(new Animated.Value(0)).current
  const dot3 = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const createBounce = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      )

    const anim1 = createBounce(dot1, 0)
    const anim2 = createBounce(dot2, 150)
    const anim3 = createBounce(dot3, 300)

    anim1.start()
    anim2.start()
    anim3.start()

    return () => {
      anim1.stop()
      anim2.stop()
      anim3.stop()
    }
  }, [dot1, dot2, dot3])

  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.foreground,
    opacity: 0.5,
    marginHorizontal: 2,
  }

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        marginVertical: 4,
        marginHorizontal: 12,
        backgroundColor: colors.neutrals800,
        borderRadius: 18,
        borderBottomLeftRadius: 4,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      accessibilityLabel="AI is typing">
      <Animated.View style={[dotStyle, { transform: [{ translateY: dot1 }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: dot2 }] }]} />
      <Animated.View style={[dotStyle, { transform: [{ translateY: dot3 }] }]} />
    </View>
  )
}
