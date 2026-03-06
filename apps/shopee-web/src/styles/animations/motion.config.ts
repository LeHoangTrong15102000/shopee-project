export const ANIMATION_DURATION = {
  instant: 0,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8
} as const

export const ANIMATION_EASING = {
  easeOut: [0.25, 0.46, 0.45, 0.94] as const,
  easeIn: [0.42, 0, 1, 1] as const,
  easeInOut: [0.42, 0, 0.58, 1] as const
} as const

export const ANIMATION_SPRING = {
  default: { type: 'spring' as const, stiffness: 300, damping: 25 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 20 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 30 }
} as const

export const STAGGER_DELAY = {
  fast: 0.015,
  normal: 0.01,
  slow: 0.1
} as const

export type AnimationDuration = (typeof ANIMATION_DURATION)[keyof typeof ANIMATION_DURATION]
export type StaggerDelay = (typeof STAGGER_DELAY)[keyof typeof STAGGER_DELAY]
