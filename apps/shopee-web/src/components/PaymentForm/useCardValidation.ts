import { useMemo, useState, useCallback } from 'react'
import { CardType } from './components/CardTypeIcons'

const detectCardType = (cardNumber: string): CardType => {
  const cleanNumber = cardNumber.replace(/\s/g, '')
  if (/^4/.test(cleanNumber)) return 'visa'
  if (/^5[1-5]/.test(cleanNumber) || /^2(2[2-9][1-9]|[3-6]|7[0-1]|720)/.test(cleanNumber)) return 'mastercard'
  if (/^3[47]/.test(cleanNumber)) return 'amex'
  if (/^35(2[89]|[3-8])/.test(cleanNumber)) return 'jcb'
  return 'unknown'
}

const luhnValidate = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\s/g, '')
  if (!/^\d+$/.test(cleanNumber) || cleanNumber.length < 13) return false
  let sum = 0
  let isEven = false
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i], 10)
    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    isEven = !isEven
  }
  return sum % 10 === 0
}

const isExpiryValid = (expiryDate: string): boolean => {
  const cleanValue = expiryDate.replace(/\D/g, '')
  if (cleanValue.length < 4) return false
  const month = parseInt(cleanValue.slice(0, 2), 10)
  const year = parseInt(cleanValue.slice(2, 4), 10)
  if (month < 1 || month > 12) return false
  const now = new Date()
  const currentYear = now.getFullYear() % 100
  const currentMonth = now.getMonth() + 1
  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false
  return true
}

export const formatCardNumber = (value: string, cardType: CardType): string => {
  const cleanValue = value.replace(/\D/g, '')
  const maxLength = cardType === 'amex' ? 15 : 16
  const trimmed = cleanValue.slice(0, maxLength)
  if (cardType === 'amex') {
    const match = trimmed.match(/^(\d{0,4})(\d{0,6})(\d{0,5})$/)
    if (match) return [match[1], match[2], match[3]].filter(Boolean).join(' ')
  }
  const groups = trimmed.match(/.{1,4}/g)
  return groups ? groups.join(' ') : trimmed
}

export const formatExpiryDate = (value: string): string => {
  const cleanValue = value.replace(/\D/g, '').slice(0, 4)
  if (cleanValue.length >= 2) return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2)}`
  return cleanValue
}

export const shakeAnimation = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 }
  }
}

interface ValidationField {
  touched: boolean
  isValid: boolean
}

interface ValidationState {
  cardNumber: ValidationField
  expiryDate: ValidationField
  cvv: ValidationField
}

export function useCardValidation(cardNumber: string, expiryDate: string, cvv: string) {
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [showCvvTooltip, setShowCvvTooltip] = useState(false)
  const [validationState, setValidationState] = useState<ValidationState>({
    cardNumber: { touched: false, isValid: false },
    expiryDate: { touched: false, isValid: false },
    cvv: { touched: false, isValid: false }
  })
  const [shakeFields, setShakeFields] = useState({ cardNumber: false, expiryDate: false, cvv: false })

  const cardType = useMemo(() => detectCardType(cardNumber), [cardNumber])
  const formattedCardNumber = useMemo(() => formatCardNumber(cardNumber, cardType), [cardNumber, cardType])
  const formattedExpiry = useMemo(() => formatExpiryDate(expiryDate), [expiryDate])

  const handleCvvFocus = useCallback(() => setIsCardFlipped(true), [])

  const handleCvvBlur = useCallback(() => {
    setIsCardFlipped(false)
    const cvvLength = cardType === 'amex' ? 4 : 3
    const isValid = cvv.length === cvvLength
    setValidationState((prev) => ({ ...prev, cvv: { touched: true, isValid } }))
    if (!isValid && cvv.length > 0) {
      setShakeFields((prev) => ({ ...prev, cvv: true }))
      setTimeout(() => setShakeFields((prev) => ({ ...prev, cvv: false })), 400)
    }
  }, [cardType, cvv])

  const handleCardNumberBlur = useCallback(() => {
    const cleanNumber = cardNumber.replace(/\s/g, '')
    const minLength = cardType === 'amex' ? 15 : 16
    const isValid = cleanNumber.length >= minLength && luhnValidate(cleanNumber)
    setValidationState((prev) => ({ ...prev, cardNumber: { touched: true, isValid } }))
    if (!isValid && cleanNumber.length > 0) {
      setShakeFields((prev) => ({ ...prev, cardNumber: true }))
      setTimeout(() => setShakeFields((prev) => ({ ...prev, cardNumber: false })), 400)
    }
  }, [cardNumber, cardType])

  const handleExpiryBlur = useCallback(() => {
    const isValid = isExpiryValid(expiryDate)
    setValidationState((prev) => ({ ...prev, expiryDate: { touched: true, isValid } }))
    if (!isValid && expiryDate.length > 0) {
      setShakeFields((prev) => ({ ...prev, expiryDate: true }))
      setTimeout(() => setShakeFields((prev) => ({ ...prev, expiryDate: false })), 400)
    }
  }, [expiryDate])

  const toggleCvvTooltip = useCallback(() => setShowCvvTooltip((prev) => !prev), [])
  const closeCvvTooltip = useCallback(() => setShowCvvTooltip(false), [])

  return {
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
  }
}
