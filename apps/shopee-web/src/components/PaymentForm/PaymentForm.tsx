import { memo, useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import Button from 'src/components/Button'
import CreditCardForm, { PaymentFormData } from './CreditCardForm'
import BankTransferPayment from './BankTransferPayment'
import EWalletPayment from './EWalletPayment'

type PaymentMethodTab = 'credit_card' | 'bank_transfer' | 'e_wallet'

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => Promise<void>
  onCancel?: () => void
  isProcessing?: boolean
  amount?: number
}

const createPaymentSchema = (t: TFunction<'payment'>) =>
  z.object({
    cardNumber: z
      .string()
      .min(1, t('creditCard.validation.cardNumberRequired'))
      .regex(/^[\d\s]{16,19}$/, t('creditCard.validation.cardNumber')),
    cardHolder: z
      .string()
      .min(1, t('creditCard.validation.cardholderName'))
      .min(2, t('creditCard.validation.cardholderNameMin'))
      .max(50, t('creditCard.validation.cardholderNameMax')),
    expiryDate: z
      .string()
      .min(1, t('creditCard.validation.expiryDateRequired'))
      .regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, t('creditCard.validation.expiryDate')),
    cvv: z
      .string()
      .min(1, t('creditCard.validation.cvvRequired'))
      .regex(/^[0-9]{3,4}$/, t('creditCard.validation.cvv')),
    saveCard: z.boolean().optional()
  })

const PaymentTabIcon = ({ type }: { type: string }) => {
  const icons: Record<string, React.ReactNode> = {
    credit_card: (
      <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
          d='M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    ),
    bank_transfer: (
      <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
          d='M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    ),
    e_wallet: (
      <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
          d='M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    )
  }
  return <>{icons[type] || null}</>
}

const SecureBadge = memo(function SecureBadge({ label }: { label: string }) {
  return (
    <div className='flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400'>
      <svg className='h-4 w-4' fill='currentColor' viewBox='0 0 20 20'>
        <path
          fillRule='evenodd'
          d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
          clipRule='evenodd'
        />
      </svg>
      <span>{label}</span>
    </div>
  )
})

const SuccessFeedback = memo(function SuccessFeedback({ title, message }: { title: string; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className='flex flex-col items-center justify-center py-12 text-center'
    >
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100'>
        <svg className='h-8 w-8 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
        </svg>
      </div>
      <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>{title}</h3>
      <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>{message}</p>
    </motion.div>
  )
})

const ErrorFeedback = memo(function ErrorFeedback({
  title,
  message,
  retryLabel,
  onRetry
}: {
  title: string
  message: string
  retryLabel: string
  onRetry: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className='flex flex-col items-center justify-center py-12 text-center'
    >
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
        <svg className='h-8 w-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
        </svg>
      </div>
      <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>{title}</h3>
      <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>{message}</p>
      <Button
        type='button'
        onClick={onRetry}
        className='mt-4 rounded-lg bg-orange px-4 py-2 text-white hover:bg-orange/90'
      >
        {retryLabel}
      </Button>
    </motion.div>
  )
})

const PaymentForm = memo(function PaymentForm({
  onSubmit,
  onCancel,
  isProcessing = false,
  amount = 150000
}: PaymentFormProps) {
  const { t } = useTranslation('payment')
  const [activeTab, setActiveTab] = useState<PaymentMethodTab>('credit_card')
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const paymentSchema = useMemo(() => createPaymentSchema(t), [t])

  const paymentTabs: { id: PaymentMethodTab; label: string }[] = [
    { id: 'credit_card', label: t('tabs.creditCard') },
    { id: 'bank_transfer', label: t('tabs.bankTransfer') },
    { id: 'e_wallet', label: t('tabs.eWallet') }
  ]

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      cardNumber: '',
      cardHolder: '',
      expiryDate: '',
      cvv: '',
      saveCard: false
    }
  })

  const handleFormSubmit = useCallback(
    async (data: PaymentFormData) => {
      setPaymentStatus('processing')
      setErrorMessage('')
      try {
        await onSubmit(data)
        setPaymentStatus('success')
      } catch (error) {
        setPaymentStatus('error')
        setErrorMessage(error instanceof Error ? error.message : t('status.error'))
      }
    },
    [onSubmit, t]
  )

  const handleRetry = useCallback(() => {
    setPaymentStatus('idle')
    setErrorMessage('')
  }, [])

  if (paymentStatus === 'success') {
    return <SuccessFeedback title={t('status.success')} message={t('status.processing')} />
  }

  if (paymentStatus === 'error') {
    return (
      <ErrorFeedback
        title={t('status.failed')}
        message={errorMessage}
        retryLabel={t('buttons.retry')}
        onRetry={handleRetry}
      />
    )
  }

  const isLoading = paymentStatus === 'processing' || isProcessing

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>{t('title')}</h3>
        <SecureBadge label={t('secureBadge')} />
      </div>

      <div className='flex gap-2 overflow-x-auto border-b border-gray-200 pb-1 dark:border-slate-700'>
        {paymentTabs.map((tab) => (
          <Button
            key={tab.id}
            type='button'
            onClick={() => setActiveTab(tab.id)}
            variant='ghost'
            animated={false}
            className={`flex shrink-0 items-center gap-2 rounded-t-lg px-4 py-3 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'border-b-2 border-orange bg-orange/5 text-orange'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-gray-200'
            }`}
          >
            <PaymentTabIcon type={tab.id} />
            <span className='hidden sm:inline'>{tab.label}</span>
          </Button>
        ))}
      </div>

      <AnimatePresence mode='wait'>
        {activeTab === 'credit_card' && (
          <motion.form
            key='credit_card'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleSubmit(handleFormSubmit)}
            className='space-y-6'
          >
            <CreditCardForm register={register} errors={errors} watch={watch} />

            <div className='flex items-center gap-2'>
              <input
                type='checkbox'
                id='saveCard'
                {...register('saveCard')}
                className='h-4 w-4 rounded-sm border-gray-300 text-orange focus:ring-orange dark:border-slate-600 dark:bg-slate-800'
              />
              <label htmlFor='saveCard' className='text-sm text-gray-700 dark:text-gray-300'>
                {t('creditCard.saveCard')}
              </label>
            </div>

            <div className='flex flex-col-reverse gap-3 sm:flex-row sm:justify-end'>
              {onCancel && (
                <Button
                  type='button'
                  onClick={onCancel}
                  disabled={isLoading}
                  className='w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-gray-700 hover:bg-gray-50 sm:w-auto dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
                >
                  {t('buttons.cancel')}
                </Button>
              )}
              <Button
                type='submit'
                disabled={isLoading}
                isLoading={isLoading}
                className='w-full rounded-lg bg-orange px-6 py-3 text-white hover:bg-orange/90 disabled:opacity-50 sm:w-auto'
              >
                {isLoading ? t('status.processing') : t('buttons.pay')}
              </Button>
            </div>
          </motion.form>
        )}

        {activeTab === 'bank_transfer' && (
          <motion.div
            key='bank_transfer'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <BankTransferPayment
              amount={amount}
              onPaymentConfirmed={() => setPaymentStatus('success')}
              onPaymentExpired={() => {
                setErrorMessage(t('bankTransfer.expired'))
                setPaymentStatus('error')
              }}
            />
          </motion.div>
        )}

        {activeTab === 'e_wallet' && (
          <motion.div
            key='e_wallet'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <EWalletPayment
              amount={amount}
              onPaymentComplete={() => setPaymentStatus('success')}
              onPaymentFailed={(error) => {
                setErrorMessage(error)
                setPaymentStatus('error')
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default PaymentForm
