import { motion } from 'framer-motion'
import { Link } from 'react-router'
import path from 'src/constant/path'
import SEO from 'src/components/SEO'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { useIsMobile } from 'src/hooks/useIsMobile'
import { staggerContainer, staggerItem, STAGGER_DELAY, ANIMATION_DURATION } from 'src/styles/animations'

const NotFound = () => {
  const reducedMotion = useReducedMotion()
  const isMobile = useIsMobile()
  const disableAnimation = reducedMotion || isMobile

  const containerVariants = staggerContainer(STAGGER_DELAY.slow)

  const floatingVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: ANIMATION_DURATION.slow, ease: 'easeOut' }
    }
  }

  return (
    <motion.main
      className='flex h-screen w-full flex-col items-center justify-center bg-black/5 dark:bg-slate-900'
      variants={disableAnimation ? undefined : containerVariants}
      initial={disableAnimation ? undefined : 'hidden'}
      animate={disableAnimation ? undefined : 'visible'}
    >
      <SEO title='Không tìm thấy trang' noindex />
      <motion.h1
        className='text-6xl font-extrabold tracking-widest text-black/90 sm:text-7xl md:text-9xl dark:text-gray-100'
        variants={disableAnimation ? undefined : floatingVariants}
      >
        404
      </motion.h1>
      <motion.div
        className='absolute rotate-12 rounded-sm bg-orange px-2 text-sm text-white'
        variants={disableAnimation ? undefined : staggerItem}
      >
        Page Not Found
      </motion.div>
      <motion.div className='mt-5' variants={disableAnimation ? undefined : staggerItem}>
        <Link
          to={path.home} // cho redirect về Home
          className='group relative inline-block text-sm font-medium text-orange focus:ring-3 focus:outline-hidden active:text-orange-500 dark:text-orange-400'
        >
          <span className='absolute inset-0 translate-x-0.5 translate-y-0.5 bg-[#FF6A3D] transition-transform group-hover:translate-x-0 group-hover:translate-y-0' />
          <span className='relative block border border-current bg-orange px-8 py-3'>
            <span className='text-white'>Go Home</span>
          </span>
        </Link>
      </motion.div>
    </motion.main>
  )
}

export default NotFound
