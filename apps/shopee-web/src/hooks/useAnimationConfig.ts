import { Variants } from 'framer-motion'
import { useReducedMotion } from './useReducedMotion'

interface AnimationConfig {
  initial: string | boolean
  animate: string
  exit?: string
  variants?: Variants
  transition?: Record<string, unknown>
}

// Returns animation config that respects reduced motion preference
export function useAnimationConfig(variants: Variants, options?: { exitVariant?: string }): AnimationConfig {
  const reducedMotion = useReducedMotion()

  if (reducedMotion) {
    return {
      initial: false,
      animate: 'visible',
      exit: options?.exitVariant || 'exit',
      variants: {
        hidden: {},
        visible: {},
        exit: {},
        ...Object.fromEntries(Object.keys(variants).map((key) => [key, {}]))
      },
      transition: { duration: 0 }
    }
  }

  return {
    initial: 'hidden',
    animate: 'visible',
    exit: options?.exitVariant || 'exit',
    variants
  }
}

// Simple boolean check for inline animations
export function useCanAnimate(): boolean {
  const reducedMotion = useReducedMotion()
  return !reducedMotion
}
