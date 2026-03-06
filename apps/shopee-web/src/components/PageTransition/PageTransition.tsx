import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useLocation } from 'react-router'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { pageTransition, pageTransitionReduced } from 'src/styles/animations'

interface Props {
  children: React.ReactNode
}

const PageTransition = ({ children }: Props) => {
  const location = useLocation()
  const reducedMotion = useReducedMotion()
  const isFirstMount = useRef(true)
  const variants = reducedMotion ? pageTransitionReduced : pageTransition

  // Skip animation on initial mount for faster perceived load
  if (isFirstMount.current) {
    isFirstMount.current = false
    return (
      <motion.div key={location.pathname} initial={false} animate='animate' exit='exit' variants={variants}>
        {children}
      </motion.div>
    )
  }

  return (
    <motion.div key={location.pathname} variants={variants} initial='initial' animate='animate' exit='exit'>
      {children}
    </motion.div>
  )
}

export default PageTransition
