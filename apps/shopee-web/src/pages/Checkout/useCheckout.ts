import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { useCartStore, useCartItems, useCheckedItems } from 'src/stores/cart.store'
import { Address, ShippingMethod, PaymentMethodType, CreateOrderBody } from 'src/types/checkout.type'
import checkoutApi from 'src/apis/checkout.api'
import path from 'src/constant/path'
import { scrollToTop } from 'src/utils/utils'
import { useReducedMotion } from 'src/hooks/useReducedMotion'

const CHECKOUT_SESSION_KEY = 'checkout_items'

export const useCheckout = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const extendedPurchases = useCartItems()
  const setExtendedPurchases = useCartStore((s) => s.setItems)
  const clearCheckedItems = useCartStore((s) => s.clearCheckedItems)
  const checkedItems = useCheckedItems()
  const prefersReducedMotion = useReducedMotion()

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
    const hasSavedItems = savedItems && JSON.parse(savedItems).some((item: { isChecked: boolean }) => item.isChecked)

    if (checkedItems.length === 0 && !hasSavedItems) {
      toast.warning('Vui lòng chọn sản phẩm để thanh toán')
      navigate(path.cart)
    }
  }, [checkedItems.length, navigate])

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<ShippingMethod | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType | null>(null)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [coinsUsed, setCoinsUsed] = useState(0)
  const [note, setNote] = useState('')
  const [showReview, setShowReview] = useState(false)

  const createOrderMutation = useMutation({
    mutationFn: (body: CreateOrderBody) => checkoutApi.createOrder(body),
    onSuccess: () => {
      toast.success('Đặt hàng thành công!')
      sessionStorage.removeItem(CHECKOUT_SESSION_KEY)
      clearCheckedItems()
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      navigate(`/user/purchase?status=1`)
    },
    onError: () => {
      toast.error('Đặt hàng thất bại. Vui lòng thử lại!')
    }
  })

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address)
  }

  const handleShippingSelect = (method: ShippingMethod) => {
    setSelectedShippingMethod(method)
  }

  const handlePaymentSelect = (method: { type: PaymentMethodType }) => {
    setSelectedPaymentMethod(method.type)
  }

  const handleApplyVoucher = () => {
    if (voucherCode.trim()) {
      const code = voucherCode.toUpperCase()
      if (code === 'GIAM10') {
        setVoucherDiscount(10000)
        toast.success('Áp dụng voucher thành công! Giảm 10.000đ')
      } else if (code === 'GIAM50K') {
        setVoucherDiscount(50000)
        toast.success('Áp dụng voucher thành công! Giảm 50.000đ')
      } else if (code === 'DISCOUNT50') {
        setVoucherDiscount(50000)
        toast.success('Áp dụng voucher thành công! Giảm 50.000đ')
      } else if (code === 'FREESHIP') {
        setVoucherDiscount(30000)
        toast.success('Áp dụng voucher thành công! Miễn phí vận chuyển')
      } else if (code === 'NEWUSER') {
        setVoucherDiscount(100000)
        toast.success('Áp dụng voucher thành công! Giảm 100.000đ cho khách hàng mới')
      } else {
        toast.error('Mã voucher không hợp lệ. Thử: GIAM10, GIAM50K, DISCOUNT50, FREESHIP, NEWUSER')
      }
    }
  }

  const handleRemoveVoucher = () => {
    setVoucherCode('')
    setVoucherDiscount(0)
    toast.info('Đã xóa mã giảm giá')
  }

  const handleBackToStep3 = () => {
    setShowReview(false)
    scrollToTop(prefersReducedMotion)
  }

  const handleGoToReview = () => {
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng')
      return
    }
    if (!selectedShippingMethod) {
      toast.error('Vui lòng chọn phương thức vận chuyển')
      return
    }
    if (!selectedPaymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán')
      return
    }
    setShowReview(true)
    scrollToTop(prefersReducedMotion)
  }

  const handlePlaceOrder = () => {
    if (!selectedAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng')
      return
    }
    if (!selectedShippingMethod) {
      toast.error('Vui lòng chọn phương thức vận chuyển')
      return
    }
    if (!selectedPaymentMethod) {
      toast.error('Vui lòng chọn phương thức thanh toán')
      return
    }

    const orderBody: CreateOrderBody = {
      purchaseIds: checkedItems.map((item) => item._id),
      shippingAddressId: selectedAddress._id,
      shippingMethodId: selectedShippingMethod._id,
      paymentMethod: selectedPaymentMethod,
      voucherCode: voucherCode || undefined,
      coinsUsed: coinsUsed || undefined,
      note: note || undefined
    }

    createOrderMutation.mutate(orderBody)
  }

  const isFormValid =
    !!selectedAddress && !!selectedShippingMethod && !!selectedPaymentMethod && checkedItems.length > 0

  const currentStep = useMemo(() => {
    if (!selectedAddress) return 1
    if (!selectedShippingMethod) return 2
    if (!selectedPaymentMethod) return 3
    return 4
  }, [selectedAddress, selectedShippingMethod, selectedPaymentMethod])

  const totalAmount = useMemo(() => {
    const itemsTotal = checkedItems.reduce((sum, item) => sum + item.product.price * item.buy_count, 0)
    const shippingFee = selectedShippingMethod?.price || 0
    return itemsTotal + shippingFee - voucherDiscount - coinsUsed
  }, [checkedItems, selectedShippingMethod, voucherDiscount, coinsUsed])

  return {
    selectedAddress,
    selectedShippingMethod,
    selectedPaymentMethod,
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
    setVoucherCode,
    setCoinsUsed,
    setNote,
    handleAddressSelect,
    handleShippingSelect,
    handlePaymentSelect,
    handleApplyVoucher,
    handleRemoveVoucher,
    handleBackToStep3,
    handleGoToReview,
    handlePlaceOrder
  }
}
