import { AnimatePresence, motion } from 'framer-motion'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { useTheme } from 'src/hooks/useTheme'
import Button from 'src/components/Button'

// Icons
const SunIcon = () => (
  <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
    <path
      fillRule='evenodd'
      d='M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z'
      clipRule='evenodd'
    />
  </svg>
)

const MoonIcon = () => (
  <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20' aria-hidden='true'>
    <path d='M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' />
  </svg>
)

interface ThemeToggleProps {
  className?: string
  colorClassName?: string
}

const ThemeToggle = ({ className = '', colorClassName }: ThemeToggleProps) => {
  const { resolvedTheme, toggleTheme } = useTheme()
  const prefersReducedMotion = useReducedMotion()
  const isDark = resolvedTheme === 'dark'
  const colorClasses = colorClassName ?? 'text-white/90 hover:text-white'

  return (
    <Button
      variant='icon'
      animated={false}
      onClick={toggleTheme}
      className={`${colorClasses} ${className} border-none transition-all duration-200 hover:scale-110 focus:border-none focus:ring-0 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-0 active:scale-90`}
      aria-label={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
    >
      <AnimatePresence mode='wait'>
        <motion.div
          key={resolvedTheme}
          initial={prefersReducedMotion ? {} : { rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={prefersReducedMotion ? {} : { rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {isDark ? <MoonIcon /> : <SunIcon />}
        </motion.div>
      </AnimatePresence>
    </Button>
  )
}

export default ThemeToggle
