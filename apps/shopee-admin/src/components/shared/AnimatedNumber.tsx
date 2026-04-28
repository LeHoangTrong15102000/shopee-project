import { useEffect, useRef, useState } from 'react'
import { useSpring, useTransform, useMotionValueEvent, useReducedMotion } from 'motion/react'

interface AnimatedNumberProps {
  value: number
  formatter?: (value: number) => string
  className?: string
}

export function AnimatedNumber({ value, formatter, className }: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotion()
  // Initialize spring at the target value so the initial render shows the correct number
  const spring = useSpring(value, { stiffness: 100, damping: 20, mass: 0.5 })
  const hasAnimated = useRef(false)
  const display = useTransform(spring, (latest) => {
    const rounded = Math.round(latest)
    return formatter ? formatter(rounded) : String(rounded)
  })
  const [displayText, setDisplayText] = useState(() =>
    formatter ? formatter(value) : String(value),
  )

  useMotionValueEvent(display, 'change', (v) => setDisplayText(v as string))

  useEffect(() => {
    if (prefersReducedMotion) return
    if (!hasAnimated.current) {
      // Animate from 0 to value on first mount
      spring.jump(0)
      spring.set(value)
      hasAnimated.current = true
    } else {
      spring.set(value)
    }
  }, [value, spring, prefersReducedMotion])

  if (prefersReducedMotion) {
    return (
      <span className={className}>
        {formatter ? formatter(value) : String(value)}
      </span>
    )
  }

  return <span className={className}>{displayText}</span>
}
