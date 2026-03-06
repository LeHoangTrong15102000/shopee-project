import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Button from 'src/components/Button'
import { CardTypeIcon, CardType } from './CardTypeIcons'

const CardFront = memo(function CardFront({
  cardNumber,
  cardHolder,
  expiryDate,
  cardType,
  gradient
}: {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cardType: CardType
  gradient: string
}) {
  const displayNumber = cardNumber || '•••• •••• •••• ••••'
  const displayHolder = cardHolder || 'CARDHOLDER NAME'
  const displayExpiry = expiryDate || 'MM/YY'

  return (
    <div
      className={`absolute inset-0 rounded-xl bg-linear-to-br ${gradient} p-6 text-white shadow-xl backface-hidden`}
      style={{ backfaceVisibility: 'hidden' }}
    >
      <div className='absolute top-6 right-6'>
        <CardTypeIcon type={cardType} />
      </div>
      <div className='absolute top-12 left-6 h-10 w-14 rounded-sm bg-linear-to-br from-yellow-300 to-yellow-500' />
      <div className='absolute right-6 bottom-20 left-6'>
        <p className='font-mono text-xl tracking-widest'>{displayNumber}</p>
      </div>
      <div className='absolute right-6 bottom-6 left-6 flex justify-between'>
        <div>
          <p className='text-xs text-white/70 uppercase'>Card Holder</p>
          <p className='font-medium tracking-wide uppercase'>{displayHolder}</p>
        </div>
        <div className='text-right'>
          <p className='text-xs text-white/70 uppercase'>Expires</p>
          <p className='font-medium'>{displayExpiry}</p>
        </div>
      </div>
    </div>
  )
})

const CardBack = memo(function CardBack({
  cvv,
  gradient,
  cardType
}: {
  cvv: string
  gradient: string
  cardType: CardType
}) {
  const cvvLength = cardType === 'amex' ? 4 : 3
  const displayCvv = cvv ? cvv.padEnd(cvvLength, '•') : '•'.repeat(cvvLength)

  return (
    <div
      className={`absolute inset-0 rounded-xl bg-linear-to-br ${gradient} text-white shadow-xl`}
      style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
    >
      <div className='absolute top-8 right-0 left-0 h-12 bg-gray-900' />
      <div className='absolute top-24 right-6 left-6'>
        <div className='flex items-center'>
          <div className='h-10 flex-1 rounded-sm bg-white/90' />
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className='ml-2 flex h-10 w-16 items-center justify-center rounded-sm bg-yellow-400 font-mono text-lg font-bold text-gray-800'
          >
            {displayCvv}
          </motion.div>
        </div>
        <p className='mt-2 text-right text-xs text-white/70'>CVV/CVC</p>
      </div>
      <div className='absolute right-6 bottom-6 left-6'>
        <div className='h-8 w-12 rounded-sm bg-linear-to-br from-gray-300 to-gray-400' />
      </div>
    </div>
  )
})

export const VisualCardPreview = memo(function VisualCardPreview({
  cardNumber,
  cardHolder,
  expiryDate,
  cardType,
  cvv,
  isFlipped
}: {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cardType: CardType
  cvv: string
  isFlipped: boolean
}) {
  const gradientMap: Record<CardType, string> = {
    visa: 'from-blue-600 to-blue-800',
    mastercard: 'from-red-500 to-orange-600',
    jcb: 'from-green-500 to-teal-600',
    amex: 'from-blue-400 to-blue-600',
    unknown: 'from-gray-600 to-gray-800'
  }
  const gradient = gradientMap[cardType]

  return (
    <div className='h-48 w-full max-w-sm' style={{ perspective: '1000px' }}>
      <motion.div
        className='relative h-full w-full'
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <CardFront
          cardNumber={cardNumber}
          cardHolder={cardHolder}
          expiryDate={expiryDate}
          cardType={cardType}
          gradient={gradient}
        />
        <CardBack cvv={cvv} gradient={gradient} cardType={cardType} />
      </motion.div>
    </div>
  )
})

export const CVVTooltip = memo(function CVVTooltip({
  isVisible,
  onClose,
  cardType
}: {
  isVisible: boolean
  onClose: () => void
  cardType: CardType
}) {
  const cvvLength = cardType === 'amex' ? 4 : 3
  const cvvLocation = cardType === 'amex' ? 'mặt trước thẻ' : 'mặt sau thẻ'

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className='absolute bottom-full left-0 z-50 mb-2 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-xl dark:border-slate-600 dark:bg-slate-800'
        >
          <Button
            onClick={onClose}
            variant='text'
            animated={false}
            className='absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'
            aria-label='Đóng tooltip'
          >
            <svg className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
              <path
                fillRule='evenodd'
                d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                clipRule='evenodd'
              />
            </svg>
          </Button>
          <p className='mb-3 text-sm font-medium text-gray-800 dark:text-gray-200'>CVV là gì?</p>
          <p className='mb-3 text-xs text-gray-600 dark:text-gray-400'>
            Mã bảo mật {cvvLength} chữ số nằm ở {cvvLocation}
          </p>
          <div className='relative h-20 w-full rounded-lg bg-linear-to-br from-gray-600 to-gray-800'>
            {cardType === 'amex' ? (
              <div className='absolute top-4 right-4'>
                <div className='rounded-sm bg-yellow-400 px-2 py-1 text-xs font-bold text-gray-800'>{cvvLength} số</div>
              </div>
            ) : (
              <>
                <div className='absolute top-4 right-0 left-0 h-6 bg-gray-900' />
                <div className='absolute right-4 bottom-4 left-4 flex items-center justify-end'>
                  <div className='mr-2 h-4 w-24 rounded-sm bg-white' />
                  <div className='rounded-sm bg-yellow-400 px-2 py-1 text-xs font-bold text-gray-800'>
                    {cvvLength} số
                  </div>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})
