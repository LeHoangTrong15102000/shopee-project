import { memo } from 'react'
import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import Input from 'src/components/Input'
import Button from 'src/components/Button'
import { CardTypeIcon, CheckmarkIcon, InfoIcon } from './components/CardTypeIcons'
import { VisualCardPreview, CVVTooltip } from './components/VisualCardPreview'
import SecurityBadges from './shared/SecurityBadges'
import { useCardValidation, shakeAnimation } from './useCardValidation'

export interface PaymentFormData {
  cardNumber: string
  cardHolder: string
  expiryDate: string
  cvv: string
  saveCard?: boolean
}

interface CreditCardFormProps {
  register: UseFormRegister<PaymentFormData>
  errors: FieldErrors<PaymentFormData>
  watch: UseFormWatch<PaymentFormData>
}

const CreditCardForm = memo(function CreditCardForm({ register, errors, watch }: CreditCardFormProps) {
  const { t } = useTranslation('payment')
  const cardNumber = watch('cardNumber') || ''
  const cardHolder = watch('cardHolder') || ''
  const expiryDate = watch('expiryDate') || ''
  const cvv = watch('cvv') || ''

  const {
    cardType,
    formattedCardNumber,
    formattedExpiry,
    isCardFlipped,
    showCvvTooltip,
    validationState,
    shakeFields,
    handleCvvFocus,
    handleCvvBlur,
    handleCardNumberBlur,
    handleExpiryBlur,
    toggleCvvTooltip,
    closeCvvTooltip
  } = useCardValidation(cardNumber, expiryDate, cvv)

  return (
    <div className='space-y-4 md:space-y-6'>
      <div className='flex justify-center'>
        <VisualCardPreview
          cardNumber={formattedCardNumber}
          cardHolder={cardHolder}
          expiryDate={formattedExpiry}
          cardType={cardType}
          cvv={cvv}
          isFlipped={isCardFlipped}
        />
      </div>

      <div className='space-y-3 md:space-y-4'>
        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
            {t('creditCard.cardNumber')}
          </label>
          <motion.div className='relative' animate={shakeFields.cardNumber ? 'shake' : ''} variants={shakeAnimation}>
            <Input
              type='text'
              placeholder='1234 5678 9012 3456'
              register={register}
              name='cardNumber'
              errorMessage={errors.cardNumber?.message}
              classNameInput={`w-full rounded-lg border px-2 py-2 md:px-3 md:py-3 pr-16 md:pr-20 focus:outline-hidden ${
                validationState.cardNumber.touched
                  ? validationState.cardNumber.isValid
                    ? 'border-green-500 focus:border-green-500'
                    : 'border-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:border-orange'
              }`}
              maxLength={cardType === 'amex' ? 17 : 19}
              autoComplete='cc-number'
              onBlur={handleCardNumberBlur}
            />
            <div className='absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-2'>
              {validationState.cardNumber.touched && validationState.cardNumber.isValid && <CheckmarkIcon />}
              <CardTypeIcon type={cardType} />
            </div>
          </motion.div>
        </div>

        <div>
          <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
            {t('creditCard.cardholderName')}
          </label>
          <Input
            type='text'
            placeholder='NGUYEN VAN A'
            register={register}
            name='cardHolder'
            errorMessage={errors.cardHolder?.message}
            classNameInput='w-full rounded-lg border border-gray-300 px-2 py-2 md:px-3 md:py-3 uppercase focus:border-orange focus:outline-hidden'
            autoComplete='cc-name'
          />
        </div>

        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
              {t('creditCard.expiryDate')}
            </label>
            <motion.div className='relative' animate={shakeFields.expiryDate ? 'shake' : ''} variants={shakeAnimation}>
              <Input
                type='text'
                placeholder='MM/YY'
                register={register}
                name='expiryDate'
                errorMessage={errors.expiryDate?.message}
                classNameInput={`w-full rounded-lg border px-2 py-2 md:px-3 md:py-3 pr-8 md:pr-10 focus:outline-hidden ${
                  validationState.expiryDate.touched
                    ? validationState.expiryDate.isValid
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-orange'
                }`}
                maxLength={5}
                autoComplete='cc-exp'
                onBlur={handleExpiryBlur}
              />
              {validationState.expiryDate.touched && validationState.expiryDate.isValid && (
                <div className='absolute top-1/2 right-3 -translate-y-1/2'>
                  <CheckmarkIcon />
                </div>
              )}
            </motion.div>
          </div>
          <div>
            <div className='mb-1 flex items-center gap-1'>
              <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
                {t('creditCard.cvv')}
              </label>
              <div className='relative'>
                <Button
                  type='button'
                  onClick={toggleCvvTooltip}
                  variant='text'
                  animated={false}
                  className='flex items-center'
                  aria-label={t('creditCard.cvvTooltip')}
                >
                  <InfoIcon />
                </Button>
                <CVVTooltip isVisible={showCvvTooltip} onClose={closeCvvTooltip} cardType={cardType} />
              </div>
            </div>
            <motion.div className='relative' animate={shakeFields.cvv ? 'shake' : ''} variants={shakeAnimation}>
              <Input
                type='password'
                placeholder={cardType === 'amex' ? '••••' : '•••'}
                register={register}
                name='cvv'
                errorMessage={errors.cvv?.message}
                classNameInput={`w-full rounded-lg border px-2 py-2 md:px-3 md:py-3 pr-8 md:pr-10 focus:outline-hidden ${
                  validationState.cvv.touched
                    ? validationState.cvv.isValid
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-red-500 focus:border-red-500'
                    : 'border-gray-300 focus:border-orange'
                }`}
                maxLength={cardType === 'amex' ? 4 : 3}
                autoComplete='cc-csc'
                onFocus={handleCvvFocus}
                onBlur={handleCvvBlur}
              />
              {validationState.cvv.touched && validationState.cvv.isValid && (
                <div className='absolute top-1/2 right-3 -translate-y-1/2'>
                  <CheckmarkIcon />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <SecurityBadges />
    </div>
  )
})

export default CreditCardForm
