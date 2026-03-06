import { Variants } from 'framer-motion'
import { ANIMATION_DURATION, ANIMATION_EASING, STAGGER_DELAY } from './motion.config'

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: ANIMATION_DURATION.normal } },
  exit: { opacity: 0, transition: { duration: ANIMATION_DURATION.fast } }
}

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.normal, ease: ANIMATION_EASING.easeOut } },
  exit: { opacity: 0, y: -10, transition: { duration: ANIMATION_DURATION.fast } }
}

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.normal, ease: ANIMATION_EASING.easeOut } },
  exit: { opacity: 0, y: 10, transition: { duration: ANIMATION_DURATION.fast } }
}

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: ANIMATION_DURATION.normal, ease: ANIMATION_EASING.easeOut } },
  exit: { opacity: 0, x: 20, transition: { duration: ANIMATION_DURATION.fast } }
}

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: { duration: ANIMATION_DURATION.normal, ease: ANIMATION_EASING.easeOut } },
  exit: { opacity: 0, x: -20, transition: { duration: ANIMATION_DURATION.fast } }
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: ANIMATION_DURATION.normal, ease: ANIMATION_EASING.easeOut }
  },
  exit: { opacity: 0, scale: 0.9, transition: { duration: ANIMATION_DURATION.fast } }
}

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.slow, ease: ANIMATION_EASING.easeOut } },
  exit: { opacity: 0, y: -20, transition: { duration: ANIMATION_DURATION.fast } }
}

export const slideDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.slow, ease: ANIMATION_EASING.easeOut } },
  exit: { opacity: 0, y: 20, transition: { duration: ANIMATION_DURATION.fast } }
}

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: ANIMATION_DURATION.slow, ease: ANIMATION_EASING.easeOut } },
  exit: { opacity: 0, x: 50, transition: { duration: ANIMATION_DURATION.fast } }
}

export const slideRight: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: ANIMATION_DURATION.slow, ease: ANIMATION_EASING.easeOut } },
  exit: { opacity: 0, x: -50, transition: { duration: ANIMATION_DURATION.fast } }
}

// Stagger container - use with children that have item variants
export const staggerContainer = (staggerDelay: number = STAGGER_DELAY.normal): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: staggerDelay, delayChildren: 0.1 }
  }
})

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.normal, ease: ANIMATION_EASING.easeOut } }
}

// Page transition variants
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.fast, ease: ANIMATION_EASING.easeOut } },
  exit: { opacity: 0, y: -10, transition: { duration: ANIMATION_DURATION.fast, ease: ANIMATION_EASING.easeIn } }
}

export const pageTransitionReduced: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } }
}

// Button interaction
export const buttonHover = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: ANIMATION_DURATION.fast }
}

// Cart item exit
export const cartItemExit: Variants = {
  initial: { opacity: 1, x: 0, height: 'auto' },
  exit: { opacity: 0, x: 100, height: 0, transition: { duration: ANIMATION_DURATION.normal } }
}

// Badge bounce
export const badgeBounce: Variants = {
  initial: { scale: 1 },
  bounce: { scale: [1, 1.4, 1], transition: { duration: 0.4, ease: 'easeOut' } }
}

// Error message slide-in
export const errorSlideIn: Variants = {
  hidden: { opacity: 0, y: -10, height: 0 },
  visible: { opacity: 1, y: 0, height: 'auto', transition: { duration: ANIMATION_DURATION.fast } },
  exit: { opacity: 0, y: -10, height: 0, transition: { duration: ANIMATION_DURATION.fast } }
}

// Image crossfade for product gallery
export const imageCrossfade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: ANIMATION_DURATION.normal } },
  exit: { opacity: 0, transition: { duration: ANIMATION_DURATION.fast } }
}

// Section entrance - for content sections that appear on scroll or mount
export const sectionEntrance: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: ANIMATION_DURATION.slow, ease: ANIMATION_EASING.easeOut } }
}
