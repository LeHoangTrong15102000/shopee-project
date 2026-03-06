import { AnimatePresence, motion } from 'framer-motion'
import { memo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { ANIMATION_DURATION, ANIMATION_EASING } from 'src/styles/animations'
import Button from 'src/components/Button'

const SCROLL_THRESHOLD = 300

const backToTopVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.8
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_DURATION.normal,
      ease: ANIMATION_EASING.easeOut
    }
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.8,
    transition: {
      duration: ANIMATION_DURATION.fast,
      ease: ANIMATION_EASING.easeIn
    }
  }
}

const backToTopReducedVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.1 } }
}

const BackToTopInner = () => {
  const { t } = useTranslation('common')
  const [isVisible, setIsVisible] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsVisible(window.scrollY > SCROLL_THRESHOLD)
          ticking = false
        })
        ticking = true
      }
    }

    // Check initial scroll position
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth'
    })
  }, [prefersReducedMotion])

  const variants = prefersReducedMotion ? backToTopReducedVariants : backToTopVariants

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={variants}
          initial='hidden'
          animate='visible'
          exit='exit'
          className='fixed bottom-4 left-3 z-60 md:bottom-24 md:left-6'
        >
          <Button
            shape='pill'
            animated={false}
            onClick={scrollToTop}
            className='flex h-12 w-12 items-center justify-center bg-orange text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-[#d73211] focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 active:scale-90'
            aria-label={t('aria.backToTop')}
          >
            {/* Up Arrow SVG Icon */}
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-6 w-6'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
              strokeWidth={2}
              aria-hidden='true'
            >
              <path strokeLinecap='round' strokeLinejoin='round' d='M5 15l7-7 7 7' />
            </svg>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const BackToTop = memo(BackToTopInner)

export default BackToTop
