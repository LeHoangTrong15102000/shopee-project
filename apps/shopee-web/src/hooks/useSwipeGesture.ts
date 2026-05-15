import { useState } from 'react'
import { PanInfo } from 'framer-motion'
import { useIsMobile } from '@shopee/shared-utils'
import { useReducedMotion } from './useReducedMotion'
import { useDevicePerformance } from './useDevicePerformance'
import { MOBILE_GESTURE } from 'src/styles/animations/motion.config'

export interface UseSwipeGestureOptions {
  direction: 'x' | 'y'
  threshold?: number
  velocity?: number
  onSwipe: (dir: 'left' | 'right' | 'up' | 'down') => void
  mobileOnly?: boolean
}

export interface SwipeState {
  isDragging: boolean
  offset: number
}

export interface UseSwipeGestureResult {
  dragProps: Record<string, unknown>
  swipeState: SwipeState
}

const EMPTY_RESULT: UseSwipeGestureResult = {
  dragProps: {},
  swipeState: { isDragging: false, offset: 0 },
}

export function useSwipeGesture({
  direction,
  threshold = MOBILE_GESTURE.swipeThreshold,
  velocity = MOBILE_GESTURE.swipeVelocity,
  onSwipe,
  mobileOnly = true,
}: UseSwipeGestureOptions): UseSwipeGestureResult {
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()
  const { isLowEnd } = useDevicePerformance()

  const [isDragging, setIsDragging] = useState(false)
  const [offset, setOffset] = useState(0)

  // On desktop when mobileOnly is true, return no-op
  if (mobileOnly && !isMobile) {
    return EMPTY_RESULT
  }

  // Reduced motion: no drag behavior
  if (reducedMotion) {
    return EMPTY_RESULT
  }

  const dragTransition = isLowEnd ? { duration: 0.15 } : MOBILE_GESTURE.dragTransition

  const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentOffset = direction === 'x' ? info.offset.x : info.offset.y
    setIsDragging(true)
    setOffset(currentOffset)
  }

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false)
    setOffset(0)

    const offsetValue = direction === 'x' ? info.offset.x : info.offset.y
    const velocityValue = direction === 'x' ? info.velocity.x : info.velocity.y

    const meetsThreshold = Math.abs(offsetValue) >= threshold
    const meetsVelocity = Math.abs(velocityValue) >= velocity

    if (meetsThreshold && meetsVelocity) {
      if (direction === 'x') {
        onSwipe(offsetValue < 0 ? 'left' : 'right')
      } else {
        onSwipe(offsetValue < 0 ? 'up' : 'down')
      }
    }
  }

  return {
    dragProps: {
      drag: direction,
      dragElastic: MOBILE_GESTURE.dragElasticity,
      dragDirectionLock: true,
      dragTransition,
      onDrag: handleDrag,
      onDragEnd: handleDragEnd,
    },
    swipeState: { isDragging, offset },
  }
}
