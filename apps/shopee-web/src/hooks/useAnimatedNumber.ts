import { useEffect, useRef, useState } from 'react'

/**
 * Hook: Animated number counting effect
 * Smoothly animates a number from its previous value to a new value
 * using easeOutCubic easing for smooth deceleration
 */
const useAnimatedNumber = (value: number, duration = 400) => {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current === value) return
    const startValue = prevValue.current
    const diff = value - startValue
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // easeOutCubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(Math.round(startValue + diff * eased))
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
    prevValue.current = value
  }, [value, duration])

  return displayValue
}

export default useAnimatedNumber
