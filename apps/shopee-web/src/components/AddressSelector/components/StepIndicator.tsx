import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { FORM_STEPS } from '../addressForm.constants'

interface StepIndicatorProps {
  currentStep: number
  stepProgress: number
  canProceedToStep: (step: number) => boolean | string | undefined
  onStepClick: (step: number) => void
}

export default function StepIndicator({
  currentStep,
  stepProgress,
  canProceedToStep,
  onStepClick
}: StepIndicatorProps) {
  const { t } = useTranslation('address')

  return (
    <div className='border-b border-gray-100 bg-linear-to-b from-gray-50/80 to-white px-4 py-5 sm:px-6 sm:py-6 dark:border-slate-700 dark:from-slate-700/50 dark:to-slate-800'>
      <div className='flex items-center justify-center'>
        {FORM_STEPS.map((step, index) => {
          const isCompleted = stepProgress >= step.id && currentStep !== step.id
          const isCurrent = currentStep === step.id
          const canClick = canProceedToStep(step.id)
          const stepTitle = t(step.titleKey as 'step.contact' | 'step.location' | 'step.details')

          return (
            <div key={step.id} className='flex items-center'>
              <button
                type='button'
                onClick={() => canClick && onStepClick(step.id)}
                disabled={!canClick}
                className='group flex flex-col items-center gap-2 rounded-lg p-1 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange/50 focus-visible:ring-offset-2'
                aria-label={t('stepAria', { step: step.id, title: stepTitle })}
                aria-current={isCurrent ? 'step' : undefined}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    boxShadow: isCurrent
                      ? '0 0 0 4px rgba(238, 77, 45, 0.15), 0 4px 12px rgba(238, 77, 45, 0.25)'
                      : isCompleted
                        ? '0 2px 8px rgba(34, 197, 94, 0.3)'
                        : '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-12 sm:w-12 ${
                    isCompleted
                      ? 'border-green-500 bg-linear-to-br from-green-500 to-emerald-500'
                      : isCurrent
                        ? 'border-orange bg-linear-to-br from-orange to-orange/90'
                        : canClick
                          ? 'border-gray-300 bg-white group-hover:border-orange/50 group-hover:bg-orange/5 dark:border-slate-500 dark:bg-slate-700 dark:group-hover:bg-orange/10'
                          : 'border-gray-200 bg-gray-50 dark:border-slate-600 dark:bg-slate-700'
                  }`}
                >
                  {isCompleted && (
                    <motion.svg
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className='h-5 w-5 text-white sm:h-6 sm:w-6'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M5 13l4 4L19 7' />
                    </motion.svg>
                  )}
                  {!isCompleted && (
                    <motion.span
                      initial={false}
                      animate={{ scale: isCurrent ? 1 : 0.9 }}
                      className={`text-sm font-bold sm:text-base ${
                        isCurrent
                          ? 'text-white'
                          : canClick
                            ? 'text-gray-500 group-hover:text-orange dark:text-gray-400'
                            : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {step.id}
                    </motion.span>
                  )}
                </motion.div>

                <motion.span
                  initial={false}
                  animate={{ y: isCurrent ? -2 : 0 }}
                  className={`text-xs font-medium whitespace-nowrap transition-colors duration-200 sm:text-sm ${
                    isCompleted
                      ? 'text-green-600 dark:text-green-400'
                      : isCurrent
                        ? 'font-semibold text-orange'
                        : canClick
                          ? 'text-gray-500 group-hover:text-orange/80 dark:text-gray-400'
                          : 'text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {stepTitle as string}
                </motion.span>
              </button>

              {index < FORM_STEPS.length - 1 && (
                <div className='relative mx-2 h-0.5 w-8 overflow-hidden rounded-full bg-gray-200 sm:mx-4 sm:w-16 dark:bg-slate-600'>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: stepProgress > step.id ? '100%' : currentStep > step.id ? '100%' : '0%'
                    }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className='absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-green-500 to-emerald-400'
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
