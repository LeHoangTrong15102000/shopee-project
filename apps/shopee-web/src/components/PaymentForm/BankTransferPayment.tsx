import { memo, useState, useEffect, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Button from 'src/components/Button'
import BankDropdown, { BANKS } from './components/BankDropdown'
import { BankInfo } from './components/BankLogo'
import VietQRCode from './components/VietQRCode'
import AccountInfoCard from './components/AccountInfoCard'
import UploadReceipt from './components/UploadReceipt'
import VerificationPendingView from './components/VerificationPendingView'
import { BankTransferCountdownTimer } from './shared/CountdownTimer'

type PaymentState = 'select_bank' | 'payment_info' | 'verification_pending' | 'expired'

interface BankTransferPaymentProps {
  amount?: number
  orderId?: string
  onPaymentConfirmed?: () => void
  onPaymentExpired?: () => void
}

const PAYMENT_DEADLINE_SECONDS = 24 * 60 * 60
const LOCAL_STORAGE_KEY = 'shopee_last_selected_bank'

const generateTransferContent = (orderId: string): string => {
  return `SHOPEE ${orderId.toUpperCase()}`
}

const BankTransferPayment = memo(function BankTransferPayment({
  amount = 500000,
  orderId = 'ORD' + Date.now().toString().slice(-8),
  onPaymentConfirmed,
  onPaymentExpired
}: BankTransferPaymentProps) {
  const { t } = useTranslation('payment')
  const [paymentState, setPaymentState] = useState<PaymentState>('select_bank')
  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(PAYMENT_DEADLINE_SECONDS)
  const [_receiptFile, setReceiptFile] = useState<File | null>(null)

  const transferContent = useMemo(() => generateTransferContent(orderId), [orderId])

  // Load last selected bank from localStorage
  useEffect(() => {
    const savedBankId = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (savedBankId) {
      const bank = BANKS.find((b) => b.id === savedBankId)
      if (bank) setSelectedBank(bank)
    }
  }, [])

  // Save selected bank to localStorage
  useEffect(() => {
    if (selectedBank) {
      localStorage.setItem(LOCAL_STORAGE_KEY, selectedBank.id)
    }
  }, [selectedBank])

  // Countdown timer
  useEffect(() => {
    if (paymentState === 'expired') return
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [paymentState])

  const handleSelectBank = useCallback((bank: BankInfo) => {
    setSelectedBank(bank)
  }, [])

  const handleToggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev)
  }, [])

  const handleProceedToPayment = useCallback(() => {
    if (selectedBank) setPaymentState('payment_info')
  }, [selectedBank])

  const handleConfirmTransfer = useCallback(() => {
    setPaymentState('verification_pending')
    onPaymentConfirmed?.()
  }, [onPaymentConfirmed])

  const handleExpired = useCallback(() => {
    setPaymentState('expired')
    onPaymentExpired?.()
  }, [onPaymentExpired])

  const handleFileSelect = useCallback((file: File | null) => {
    setReceiptFile(file)
  }, [])

  // Bank Selection View
  if (paymentState === 'select_bank') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className='space-y-6'
      >
        <div className='rounded-xl bg-blue-50 p-4 dark:bg-blue-900/30'>
          <h4 className='font-medium text-blue-900 dark:text-blue-300'>{t('bankTransfer.title')}</h4>
          <p className='mt-1 text-sm text-blue-700 dark:text-blue-200'>{t('bankTransfer.selectBankDescription')}</p>
        </div>
        <div className='space-y-4'>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            {t('bankTransfer.selectBank')}
          </label>
          <BankDropdown
            selectedBank={selectedBank}
            onSelectBank={handleSelectBank}
            isOpen={isDropdownOpen}
            onToggle={handleToggleDropdown}
          />
        </div>
        {selectedBank && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className='pt-2'>
            <Button
              type='button'
              onClick={handleProceedToPayment}
              className='w-full rounded-xl bg-orange px-6 py-3 font-medium text-white hover:bg-orange/90'
            >
              {t('buttons.continue')}
            </Button>
          </motion.div>
        )}
      </motion.div>
    )
  }

  if (paymentState === 'verification_pending') return <VerificationPendingView />

  if (paymentState === 'expired') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className='flex flex-col items-center space-y-4 py-8'
      >
        <div className='flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
          <svg className='h-8 w-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>
        <div className='text-center'>
          <h4 className='text-lg font-medium text-gray-900 dark:text-gray-100'>{t('bankTransfer.expiredTitle')}</h4>
          <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>{t('bankTransfer.expiredMessage')}</p>
        </div>
      </motion.div>
    )
  }

  // Payment Info View (main view with QR, account info, timer)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className='space-y-6'
    >
      <BankTransferCountdownTimer seconds={timeRemaining} onExpired={handleExpired} />

      {selectedBank && (
        <>
          <div className='grid gap-6 lg:grid-cols-2'>
            <VietQRCode bank={selectedBank} amount={amount} transferContent={transferContent} />
            <AccountInfoCard bank={selectedBank} amount={amount} transferContent={transferContent} />
          </div>

          <UploadReceipt onFileSelect={handleFileSelect} />

          <div className='flex flex-col gap-3 sm:flex-row'>
            <Button
              type='button'
              onClick={() => setPaymentState('select_bank')}
              className='flex-1 rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
            >
              {t('bankTransfer.changeBank')}
            </Button>
            <Button
              type='button'
              onClick={handleConfirmTransfer}
              className='flex-1 rounded-xl bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700'
            >
              <span className='flex items-center justify-center gap-2'>
                <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                {t('bankTransfer.confirmTransfer')}
              </span>
            </Button>
          </div>
        </>
      )}
    </motion.div>
  )
})

export default BankTransferPayment
