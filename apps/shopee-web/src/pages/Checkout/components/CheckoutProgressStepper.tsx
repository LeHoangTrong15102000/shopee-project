import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

export const CHECKOUT_STEPS = [
  { id: 1, name: 'address', icon: 'location' },
  { id: 2, name: 'shipping', icon: 'truck' },
  { id: 3, name: 'payment', icon: 'payment' },
  { id: 4, name: 'confirm', icon: 'check' }
]

interface CheckoutProgressStepperProps {
  currentStep: number
}

export const CheckoutProgressStepper = ({ currentStep }: CheckoutProgressStepperProps) => {
  const { t } = useTranslation('checkout')
  return (
    <div className='mb-6 md:mb-8'>
      <div className='mx-auto flex max-w-2xl items-center justify-center'>
        {CHECKOUT_STEPS.map((step, index) => (
          <div key={step.id} className='flex flex-1 items-center'>
            <div className='flex flex-col items-center'>
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 1 }}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors md:h-10 md:w-10 ${
                  currentStep >= step.id
                    ? 'border-orange bg-orange text-white'
                    : 'border-gray-300 bg-white text-gray-400 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300'
                }`}
              >
                {currentStep > step.id ? (
                  <svg className='h-4 w-4 md:h-5 md:w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                ) : (
                  <span className='text-xs font-semibold md:text-sm'>{step.id}</span>
                )}
              </motion.div>
              <span
                className={`mt-1 text-xs font-medium md:mt-2 md:text-sm ${
                  currentStep >= step.id ? 'text-orange' : 'text-gray-400 dark:text-gray-300'
                }`}
              >
                {t(`step.${step.name}` as 'step.address' | 'step.shipping' | 'step.payment' | 'step.confirm')}
              </span>
            </div>
            {index < CHECKOUT_STEPS.length - 1 && (
              <div className='mx-1 h-0.5 flex-1 bg-gray-200 md:mx-2 dark:bg-slate-600'>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: currentStep > step.id ? '100%' : '0%' }}
                  transition={{ duration: 0.3 }}
                  className='h-full bg-orange'
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
