import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { useCartStore, useCartItems, useCheckedItems } from 'src/stores/cart.store'
import {
  Address,
  ShippingMethod,
  PaymentMethodType,
  CreateOrderBody,
  EWalletProvider,
  InitiatePaymentBody,
} from 'src/types/checkout.type'
import checkoutApi from 'src/apis/checkout.api'
import orderApi from 'src/apis/order.api'
import path from 'src/constant/path'
import { scrollToTop } from 'src/utils/utils'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import useSocket from 'src/hooks/useSocket'

const CHECKOUT_SESSION_KEY = 'checkout_items'

// Map Stripe error codes to Vietnamese user-facing messages
const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Thẻ bị từ chối. Vui lòng thử thẻ khác.',
  insufficient_funds: 'Thẻ không đủ số dư.',
  expired_card: 'Thẻ đã hết hạn.',
  incorrect_cvc: 'Mã CVC không đúng.',
}

export const useCheckout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t } = useTranslation('checkout')
  const { t: tOrder } = useTranslation('order')
  const extendedPurchases = useCartItems()
  const setExtendedPurchases = useCartStore((s) => s.setItems)
  const clearCheckedItems = useCartStore((s) => s.clearCheckedItems)
  const checkedItems = useCheckedItems()
  const prefersReducedMotion = useReducedMotion()
  const { socket } = useSocket()

  // Stripe hooks — may return null if not inside an Elements context
  const stripe = useStripe()
  const elements = useElements()

  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false)
  const [paymentWaitMessage, setPaymentWaitMessage] = useState<string | null>(null)
  // Track the pending credit card order so the socket listener can reference it
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null)
  // Use a ref so the socket handler always sees the latest value without re-registering
  const pendingOrderIdRef = useRef<string | null>(null)
  pendingOrderIdRef.current = pendingOrderId

  // Detect pending payment order on mount — enables recovery flow
  const {
    data: pendingPaymentData,
    isLoading: isPendingPaymentLoading,
  } = useQuery({
    queryKey: ['pendingPayment'],
    queryFn: () => orderApi.getPendingPaymentOrder(),
    // Only run once on mount — no refetch needed
    staleTime: Infinity,
    retry: false,
  })

  const pendingPaymentOrder = pendingPaymentData?.data?.data ?? null

  // Show a patience message after 10 seconds of waiting for Stripe to confirm
  useEffect(() => {
    if (!isConfirmingPayment) {
      setPaymentWaitMessage(null)
      return
    }
    const timer = setTimeout(() => {
      setPaymentWaitMessage('Vui lòng chờ...')
    }, 10000)
    return () => clearTimeout(timer)
  }, [isConfirmingPayment])

  // Listen for real-time payment status updates from the server webhook
  useEffect(() => {
    if (!socket) return

    const handlePaymentStatusUpdated = (payload: {
      orderId: string
      payment_status: string
      order_status: string
    }) => {
      // Only react to the order we're waiting on
      if (payload.orderId !== pendingOrderIdRef.current) return

      if (payload.payment_status === 'paid') {
        toast.success(tOrder('toast.paymentConfirmed'))
        queryClient.invalidateQueries({ queryKey: ['orders'] })
        queryClient.invalidateQueries({ queryKey: ['purchases'] })
      } else if (payload.payment_status === 'failed') {
        toast.error(tOrder('toast.paymentFailedRemote'))
      }

      setPendingOrderId(null)
    }

    socket.on('payment:status_updated', handlePaymentStatusUpdated)
    return () => {
      socket.off('payment:status_updated', handlePaymentStatusUpdated)
    }
  }, [socket, queryClient, tOrder])

  useEffect(() => {
    const savedItems = sessionStorage.getItem(CHECKOUT_SESSION_KEY)
    if (savedItems && extendedPurchases.length === 0) {
      try {
        const parsedItems = JSON.parse(savedItems)
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          setExtendedPurchases(parsedItems)
        }
      } catch {
        sessionStorage.removeItem(CHECKOUT_SESSION_KEY)
      }
    }
  }, [])

  useEffect(() => {
    if (checkedItems.length > 0) {
      sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify(extendedPurchases))
    }
  }, [checkedItems, extendedPurchases])

  useEffect(() => {
    const savedItems = sessionStorage.getItem(CHECKOUT_SESSION_KEY)
    const hasSavedItems =
      savedItems && JSON.parse(savedItems).some((item: { isChecked: boolean }) => item.isChecked)

    if (checkedItems.length === 0 && !hasSavedItems) {
      toast.warning(t('toast.selectProducts'))
      navigate(path.cart)
    }
  }, [checkedItems.length, navigate])

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null)
  const [selectedEWalletProvider, setSelectedEWalletProvider] = useState<EWalletProvider | null>(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [coinsUsed, setCoinsUsed] = useState(0)
  const [note, setNote] = useState('')
  const [showReview, setShowReview] = useState(false)

  const createOrderMutation = useMutation({
    mutationFn: (body: CreateOrderBody) => checkoutApi.createOrder(body),
    onSuccess: async (response) => {
      const orderData = response.data.data

      // Credit card: confirm payment with Stripe
      if (selectedPaymentMethod === 'credit_card' && orderData.client_secret) {
        // Guards
        if (!stripe || !elements) {
          toast.error(t('stripe.notReady', 'Stripe chưa sẵn sàng'))
          return
        }
        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          toast.error(t('stripe.noCard', 'Vui lòng nhập thông tin thẻ'))
          return
        }

        setIsConfirmingPayment(true)
        // Store the order ID so the socket listener can match the incoming event
        setPendingOrderId(orderData._id)
        try {
          const { error, paymentIntent } = await stripe.confirmCardPayment(
            orderData.client_secret,
            { payment_method: { card: cardElement } },
          )

          if (error) {
            const code = error.code || ''
            const message = STRIPE_ERROR_MESSAGES[code] || error.message || t('stripe.paymentFailed', 'Thanh toán thất bại. Vui lòng thử lại.')
            toast.error(message)
            setIsConfirmingPayment(false)
            setPendingOrderId(null)
            return
          }

          if (paymentIntent?.status === 'succeeded') {
            sessionStorage.removeItem(CHECKOUT_SESSION_KEY)
            clearCheckedItems()
            queryClient.invalidateQueries({ queryKey: ['purchases'] })
            navigate(`${path.paymentSuccess}?orderId=${orderData._id}`)
          }
        } catch {
          toast.error(t('stripe.paymentFailed', 'Thanh toán thất bại. Vui lòng thử lại.'))
          setIsConfirmingPayment(false)
          setPendingOrderId(null)
        }
        return
      }

      // Non-credit-card: existing flow
      toast.success(t('toast.orderSuccess'))
      sessionStorage.removeItem(CHECKOUT_SESSION_KEY)
      clearCheckedItems()
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      navigate(`/user/purchase?status=1`)
    },
    onError: () => {
      toast.error(t('toast.orderFailed'))
    },
  })

  const initiatePaymentMutation = useMutation({
    mutationFn: (body: InitiatePaymentBody) => checkoutApi.initiatePayment(body),
    onSuccess: (response) => {
      const { payment_url } = response.data.data
      // Redirect to external payment gateway — React Router cannot navigate to external URLs
      window.location.href = payment_url
    },
    onError: () => {
      toast.error(t('toast.orderFailed'))
    },
  })

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address)
  }

  const handleShippingSelect = (method: ShippingMethod) => {
    setSelectedShippingMethod(method)
  }

  const handlePaymentSelect = (method: { type: PaymentMethodType }) => {
    setSelectedPaymentMethod(method.type)
    // Reset e-wallet provider when switching away from e_wallet
    if (method.type !== 'e_wallet') {
      setSelectedEWalletProvider(null)
    }
  }

  const handleEWalletProviderSelect = (provider: EWalletProvider) => {
    setSelectedEWalletProvider(provider)
  }

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return

    try {
      const res = await checkoutApi.calculateSummary({
        purchaseIds: checkedItems.map((item) => item._id),
        shippingMethodId: selectedShippingMethod?._id,
        voucherCode: voucherCode,
        coinsUsed,
      })
      const summary = res.data.data
      const discount = summary.discount ?? 0
      setVoucherDiscount(discount)

      if (discount > 0) {
        const code = voucherCode.trim().toUpperCase()
        const formattedAmount = new Intl.NumberFormat('vi-VN').format(discount) + 'đ'
        if (code === 'FREESHIP') {
          toast.success(t('toast.voucherFreeShip'))
        } else if (code === 'NEWUSER') {
          toast.success(t('toast.voucherNewUser', { amount: formattedAmount }))
        } else {
          toast.success(t('toast.voucherApplied', { amount: formattedAmount }))
        }
      } else {
        toast.error(t('toast.voucherInvalid'))
      }
    } catch {
      toast.error(t('toast.voucherInvalid'))
    }
  }

  const handleRemoveVoucher = () => {
    setVoucherCode('')
    setVoucherDiscount(0)
    toast.info(t('toast.voucherRemoved'))
  }

  const handleBackToStep3 = () => {
    setShowReview(false)
    scrollToTop(prefersReducedMotion)
  }

  const handleRecoverySuccess = (orderId: string) => {
    sessionStorage.removeItem(CHECKOUT_SESSION_KEY)
    clearCheckedItems()
    queryClient.invalidateQueries({ queryKey: ['purchases'] })
    navigate(`${path.paymentSuccess}?orderId=${orderId}`)
  }

  const handleRecoveryCancelled = () => {
    queryClient.invalidateQueries({ queryKey: ['pendingPayment'] })
  }

  const handleGoToReview = () => {
    if (!selectedAddress) {
      toast.error(t('toast.selectAddress'))
      return
    }
    if (!selectedShippingMethod) {
      toast.error(t('toast.selectShipping'))
      return
    }
    if (!selectedPaymentMethod) {
      toast.error(t('toast.selectPayment'))
      return
    }
    if (selectedPaymentMethod === 'e_wallet' && !selectedEWalletProvider) {
      toast.error(t('toast.selectEWalletProvider', 'Vui lòng chọn ví điện tử (MoMo hoặc VNPay)'))
      return
    }
    setShowReview(true)
    scrollToTop(prefersReducedMotion)
  }

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast.error(t('toast.selectAddress'))
      return
    }
    if (!selectedShippingMethod) {
      toast.error(t('toast.selectShipping'))
      return
    }
    if (!selectedPaymentMethod) {
      toast.error(t('toast.selectPayment'))
      return
    }

    // E-wallet path: initiate PaymentSession and redirect to gateway
    if (selectedPaymentMethod === 'e_wallet') {
      if (!selectedEWalletProvider) {
        toast.error(t('toast.selectEWalletProvider', 'Vui lòng chọn ví điện tử (MoMo hoặc VNPay)'))
        return
      }

      const initiateBody: InitiatePaymentBody = {
        purchaseIds: checkedItems.map((item) => item._id),
        shippingAddressId: selectedAddress._id,
        shippingMethodId: selectedShippingMethod._id,
        paymentMethod: 'e_wallet',
        eWalletProvider: selectedEWalletProvider,
        voucherCode: voucherCode || undefined,
        coinsUsed: coinsUsed || undefined,
        note: note || undefined,
      }

      initiatePaymentMutation.mutate(initiateBody)
      return
    }

    // COD / bank_transfer / credit_card path
    const orderBody: CreateOrderBody = {
      purchaseIds: checkedItems.map((item) => item._id),
      shippingAddressId: selectedAddress._id,
      shippingMethodId: selectedShippingMethod._id,
      paymentMethod: selectedPaymentMethod,
      voucherCode: voucherCode || undefined,
      coinsUsed: coinsUsed || undefined,
      note: note || undefined,
    }

    createOrderMutation.mutate(orderBody)
  }

  const isFormValid =
    !!selectedAddress &&
    !!selectedShippingMethod &&
    !!selectedPaymentMethod &&
    checkedItems.length > 0 &&
    (selectedPaymentMethod !== 'e_wallet' || !!selectedEWalletProvider)

  const currentStep = (() => {
    if (!selectedAddress) return 1
    if (!selectedShippingMethod) return 2
    if (!selectedPaymentMethod) return 3
    return 4
  })()

  const totalAmount = (() => {
    const itemsTotal = checkedItems.reduce(
      (sum, item) => sum + item.product.price * item.buy_count,
      0,
    )
    const shippingFee = selectedShippingMethod?.price || 0
    return itemsTotal + shippingFee - voucherDiscount - coinsUsed
  })()

  return {
    selectedAddress,
    selectedShippingMethod,
    selectedPaymentMethod,
    selectedEWalletProvider,
    voucherCode,
    voucherDiscount,
    coinsUsed,
    note,
    showReview,
    checkedItems,
    isFormValid,
    currentStep,
    totalAmount,
    createOrderMutation,
    initiatePaymentMutation,
    isConfirmingPayment,
    paymentWaitMessage,
    pendingPaymentOrder,
    isPendingPaymentLoading,
    setVoucherCode,
    setCoinsUsed,
    setNote,
    handleAddressSelect,
    handleShippingSelect,
    handlePaymentSelect,
    handleEWalletProviderSelect,
    handleApplyVoucher,
    handleRemoveVoucher,
    handleBackToStep3,
    handleGoToReview,
    handlePlaceOrder,
    handleRecoverySuccess,
    handleRecoveryCancelled,
  }
}
