import { motion, useReducedMotion } from 'motion/react'
import { Card } from 'src/components/ui/card'
import { cn } from 'src/lib/utils'

type MotionCardProps = React.ComponentPropsWithoutRef<typeof Card>

export function MotionCard({ className, children, ...props }: MotionCardProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return (
      <Card className={cn(className)} {...props}>
        {children}
      </Card>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn('rounded-xl', className)}
    >
      <Card className="h-full" {...props}>
        {children}
      </Card>
    </motion.div>
  )
}
