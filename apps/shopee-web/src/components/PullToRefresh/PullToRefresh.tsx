import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useIsMobile } from '@shopee/shared-utils'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { MOBILE_GESTURE, MOBILE_SPRING } from 'src/styles/animations/motion.config'
import { pullToRefresh } from 'src/styles/animations/variants'

interface PullToRefreshProps {
  onRefresh: () => void | Promise<void>
  children: React.ReactNode
  threshold?: number
}

const PullToRefresh = ({
  onRefresh,
  children,
  threshold = MOBILE_GESTURE.swipeThreshold,
}: PullToRefreshProps) => {
  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // On desktop, render children directly with no drag wrapper
  if (!isMobile) {
    return <>{children}</>
  }

  const handleDrag = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number } },
  ) => {
    if (!isRefreshing) {
      setPullDistance(Math.max(0, info.offset.y))
    }
  }

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { y: number } },
  ) => {
    const distance = Math.max(0, info.offset.y)

    if (reducedMotion) {
      // Reduced motion: call onRefresh immediately on any downward drag release
      if (distance > 0) {
        setPullDistance(0)
        await onRefresh()
      }
      return
    }

    if (distance >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(distance)
      try {
        const result = onRefresh()
        if (result instanceof Promise) {
          await result
        } else {
          // void return: wait 2s
          await new Promise<void>((resolve) => setTimeout(resolve, 2000))
        }
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Snap back
      setPullDistance(0)
    }
  }

  const indicatorState = isRefreshing ? 'refreshing' : pullDistance > 20 ? 'pulling' : 'idle'

  return (
    <div className="relative overflow-hidden">
      {/* Pull indicator */}
      <motion.div
        variants={pullToRefresh}
        animate={indicatorState}
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
        aria-live="polite"
        aria-label={isRefreshing ? 'Refreshing' : 'Pull to refresh'}
      >
        {isRefreshing ? (
          /* Spinner icon when refreshing */
          <svg
            className="h-6 w-6 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        ) : (
          /* Arrow icon when pulling */
          <svg
            className="h-6 w-6 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        )}
      </motion.div>

      {/* Draggable content wrapper */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 80 }}
        dragElastic={MOBILE_GESTURE.dragElasticity}
        dragTransition={MOBILE_GESTURE.dragTransition}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ y: isRefreshing ? 40 : 0, touchAction: 'pan-x' }}
        animate={isRefreshing ? { y: 40 } : { y: 0 }}
        transition={MOBILE_SPRING.snapBack}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default PullToRefresh
