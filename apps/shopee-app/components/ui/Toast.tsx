import React, { useEffect, useState } from 'react'
import { AccessibilityInfo, Pressable, TouchableOpacity, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText, Icon } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import { cn } from '@/utils'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastProps {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  onDismiss: (id: string) => void
  position?: 'top' | 'bottom'
  index?: number
  closable?: boolean
  onPress?: () => void
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 4000,
  onDismiss,
  position = 'top',
  index = 0,
  closable = true,
  onPress,
}) => {
  const colors = useColors()
  const insets = useSafeAreaInsets()
  const { t } = useTranslation()

  const translateY = useSharedValue(position === 'top' ? -100 : 100)
  const opacity = useSharedValue(0)

  const baseOffset = 16
  const stackOffset = index * 80
  const initialPosition =
    position === 'top'
      ? insets.top + baseOffset + stackOffset
      : insets.bottom + baseOffset + stackOffset

  const positionY = useSharedValue(initialPosition)

  // Local state for text content to enable smooth updates
  const [currentTitle, setCurrentTitle] = useState(title)
  const [currentMessage, setCurrentMessage] = useState(message)
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion)
  }, [])

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'CircleCheck'
      case 'error':
        return 'CircleX'
      case 'warning':
        return 'TriangleAlert'
      case 'info':
      default:
        return 'Info'
    }
  }

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return 'text-success'
      case 'error':
        return 'text-error'
      case 'warning':
        return 'text-warning'
      case 'info':
      default:
        return 'text-primary'
    }
  }

  const animatedStyle = useAnimatedStyle(() => {
    const style: {
      transform: { translateY: number }[]
      opacity: number
      top?: number
      bottom?: number
    } = {
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }

    if (position === 'top') {
      style.top = positionY.value
    } else {
      style.bottom = positionY.value
    }

    return style
  })

  const handleDismiss = () => {
    if (reduceMotion) {
      onDismiss(id)
      return
    }
    translateY.value = withTiming(position === 'top' ? -100 : 100, { duration: 300 })
    opacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onDismiss)(id)
    })
  }

  useEffect(() => {
    // Enter animation
    if (reduceMotion) {
      translateY.value = 0
      opacity.value = 1
    } else {
      translateY.value = withSpring(0, {
        damping: 15,
        stiffness: 150,
      })
      opacity.value = withTiming(1, { duration: 300 })
    }

    // Auto dismiss - only if duration is greater than 0
    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [])

  // Animate position changes when index changes
  useEffect(() => {
    const baseOffset = 16
    const stackOffset = index * 80
    const newPosition =
      position === 'top'
        ? insets.top + baseOffset + stackOffset
        : insets.bottom + baseOffset + stackOffset

    if (reduceMotion) {
      positionY.value = newPosition
    } else {
      positionY.value = withSpring(newPosition, {
        damping: 15,
        stiffness: 150,
      })
    }
  }, [index, position, insets])

  // Update text content when props change
  useEffect(() => {
    setCurrentTitle(title)
  }, [title])

  useEffect(() => {
    setCurrentMessage(message)
  }, [message])

  const ToastContainer = onPress ? Pressable : View

  return (
    <Animated.View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={[
        animatedStyle,
        {
          position: 'absolute',
          left: 16,
          right: 16,
          zIndex: 9999,
        },
      ]}>
      <ToastContainer
        className="flex-row items-start rounded-xl p-4 shadow-lg"
        style={{
          backgroundColor: colors.neutrals1000,
          borderWidth: 1,
          borderColor: colors.neutrals800,
        }}
        onPress={onPress}
        {...(onPress && { activeOpacity: 0.8 })}>
        {/* Icon */}
        <View className="mr-3 mt-0.5">
          <Icon name={getIconName()} className={cn('h-5 w-5', getIconColor())} />
        </View>

        {/* Content */}
        <View className="flex-1">
          <AppText variant="body" weight="semibold" className="mb-1 text-foreground" raw>
            {currentTitle}
          </AppText>
          {currentMessage && (
            <AppText variant="bodySmall" className="leading-5 text-neutrals100" raw>
              {currentMessage}
            </AppText>
          )}
        </View>

        {/* Close button - only show if closable */}
        {closable && (
          <TouchableOpacity
            onPress={handleDismiss}
            className="ml-2 p-2"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('a11y.dismissNotification')}>
            <Icon name="X" className="h-4 w-4 text-neutrals100" />
          </TouchableOpacity>
        )}
      </ToastContainer>
    </Animated.View>
  )
}

export default Toast
