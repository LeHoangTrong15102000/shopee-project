import classNames from 'classnames'
import type { ReactNode } from 'react'

type StepState = 'completed' | 'current' | 'pending' | 'cancelled'

interface TimelineProps {
  children: ReactNode
  className?: string
}

interface StepProps {
  state: StepState
  label: string
  description?: string
  timestamp?: string
  icon?: ReactNode
  className?: string
}

interface LineProps {
  active?: boolean
  className?: string
}

const stateStyles: Record<StepState, { dot: string; label: string }> = {
  completed: {
    dot: 'bg-green-500 border-green-500',
    label: 'text-green-700 dark:text-green-400'
  },
  current: {
    dot: 'bg-blue-500 border-blue-500 ring-4 ring-blue-100 dark:ring-blue-900/50',
    label: 'text-blue-700 dark:text-blue-400 font-semibold'
  },
  pending: {
    dot: 'bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500',
    label: 'text-gray-400 dark:text-gray-500'
  },
  cancelled: {
    dot: 'bg-red-500 border-red-500',
    label: 'text-red-700 dark:text-red-400'
  }
}

const Step = ({ state, label, description, timestamp, icon, className }: StepProps) => {
  const styles = stateStyles[state]
  return (
    <div className={classNames('flex items-start gap-3', className)}>
      <div className='flex flex-col items-center'>
        <div className={classNames('h-3 w-3 shrink-0 rounded-full border-2', styles.dot)}>
          {icon && state === 'completed' && (
            <span className='flex h-full w-full items-center justify-center text-[8px] text-white'>✓</span>
          )}
        </div>
      </div>
      <div className='flex-1 pb-4'>
        <p className={classNames('text-sm', styles.label)}>{label}</p>
        {description && <p className='mt-0.5 text-xs text-gray-500 dark:text-gray-400'>{description}</p>}
        {timestamp && <p className='mt-0.5 text-xs text-gray-400 dark:text-gray-500'>{timestamp}</p>}
      </div>
    </div>
  )
}

const Line = ({ active = false, className }: LineProps) => (
  <div
    className={classNames('ml-[5px] h-6 w-0.5', active ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-600', className)}
  />
)

const Timeline = ({ children, className }: TimelineProps) => {
  return <div className={classNames('flex flex-col', className)}>{children}</div>
}

Timeline.Step = Step
Timeline.Line = Line

export default Timeline
