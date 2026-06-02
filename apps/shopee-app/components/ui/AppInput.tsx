import React, { forwardRef, useId, useState } from 'react'
import {
  Text,
  TextInput,
  TextInputProps,
  View,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native'
import { cn } from '@/utils'
import { cva } from 'class-variance-authority'
import { useColors } from '@/hooks/useColors.ts'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

interface AppInputProps extends TextInputProps {
  label?: string
  helperText?: string
  errorText?: string
  variant?: 'default' | 'textarea'
  size?: 'sm' | 'md' | 'lg'
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
  labelClassName?: string
  helperClassName?: string
  errorClassName?: string
  required?: boolean
}

const inputVariants = cva('border rounded-lg font-sans-medium bg-background', {
  variants: {
    variant: {
      default: 'text-foreground',
      textarea: 'min-h-20 text-top text-foreground',
    },
    size: {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-4 py-3 text-lg',
    },
    state: {
      default: 'border-neutrals900',
      focused: 'border-neutrals600',
      error: 'border-error',
    },
    hasLeftIcon: {
      true: 'pl-10',
    },
    hasRightIcon: {
      true: 'pr-10',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
    state: 'default',
  },
})

const labelVariants = cva('font-sans-medium text-foreground mb-1.5', {
  variants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
    required: {
      true: "after:content-['*'] after:text-error after:ml-1",
    },
  },
  defaultVariants: {
    size: 'md',
  },
})

const helperVariants = cva('font-sans-regular mt-1.5', {
  variants: {
    type: {
      helper: 'text-neutrals100',
      error: 'text-error',
    },
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    type: 'helper',
    size: 'md',
  },
})

const AppInput = forwardRef<TextInput, AppInputProps>(
  (
    {
      label,
      helperText,
      errorText,
      variant = 'default',
      size = 'md',
      leftIcon,
      rightIcon,
      className,
      containerClassName,
      labelClassName,
      helperClassName,
      errorClassName,
      required,
      ...props
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false)
    const hasError = !!errorText
    const state = hasError ? 'error' : focused ? 'focused' : 'default'
    const colors = useColors()
    const reactId = useId()
    const inputNativeId = `input-${reactId}`

    // Animation values
    const scale = useSharedValue(1)
    const borderOpacity = useSharedValue(0)

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      }
    })

    const borderAnimatedStyle = useAnimatedStyle(() => {
      return {
        opacity: borderOpacity.value,
      }
    })

    const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocused(true)
      scale.value = withSpring(1.02, { damping: 15, stiffness: 300 })
      borderOpacity.value = withTiming(1, { duration: 200 })
      props.onFocus?.(e)
    }

    const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
      setFocused(false)
      scale.value = withSpring(1, { damping: 15, stiffness: 300 })
      borderOpacity.value = withTiming(0, { duration: 200 })
      props.onBlur?.(e)
    }

    return (
      <View className={cn('w-full', containerClassName)}>
        {label && (
          <Text
            nativeID={`${inputNativeId}-label`}
            className={cn(labelVariants({ size, required }), labelClassName)}>
            {label}
          </Text>
        )}

        <Animated.View style={animatedStyle} className="relative">
          {leftIcon && (
            <View className="absolute left-3 top-1/2 z-10 -translate-y-1/2">{leftIcon}</View>
          )}

          {/* Animated border overlay for focus effect */}
          <Animated.View
            style={borderAnimatedStyle}
            className="z-5 pointer-events-none absolute inset-0 rounded-lg border-2 border-neutrals500"
          />

          <TextInput
            ref={ref}
            {...props}
            nativeID={inputNativeId}
            accessibilityLabelledBy={label ? `${inputNativeId}-label` : undefined}
            accessibilityLabel={!label ? props.placeholder : undefined}
            multiline={variant === 'textarea'}
            textAlignVertical={variant === 'textarea' ? 'top' : 'center'}
            onFocus={handleFocus}
            placeholderTextColor={colors.neutrals600}
            onBlur={handleBlur}
            className={cn(
              inputVariants({
                variant,
                size,
                state,
                hasLeftIcon: !!leftIcon,
                hasRightIcon: !!rightIcon,
              }),
              className
            )}
          />

          {rightIcon && (
            <View className="absolute right-3 top-1/2 z-10 -translate-y-1/2">{rightIcon}</View>
          )}
        </Animated.View>

        {(helperText || errorText) && (
          <Text
            className={cn(
              helperVariants({
                type: hasError ? 'error' : 'helper',
                size,
              }),
              hasError ? errorClassName : helperClassName
            )}
            {...(hasError && {
              accessibilityRole: 'alert' as const,
              accessibilityLiveRegion: 'polite' as const,
            })}>
            {errorText || helperText}
          </Text>
        )}
      </View>
    )
  }
)

AppInput.displayName = 'AppInput'

export default AppInput
