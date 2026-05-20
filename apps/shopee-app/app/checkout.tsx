import React, { useState, useEffect } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useColors } from '@/hooks/useColors'
import {
  useCheckoutSummary,
  useShippingMethods,
  usePaymentMethods,
  useCreateOrder,
} from '@/hooks/useCheckout'
import { useAddresses } from '@/hooks/useAddresses'
import { useApplyVoucher } from '@/hooks/useVouchers'
import CheckoutAddressCard from '@/components/checkout/CheckoutAddressCard'
import ShippingMethodSelector from '@/components/checkout/ShippingMethodSelector'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'
import VoucherInput from '@/components/checkout/VoucherInput'
import CoinsToggle from '@/components/checkout/CoinsToggle'
import PriceBreakdown from '@/components/checkout/PriceBreakdown'
import CheckoutFooter from '@/components/checkout/CheckoutFooter'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { Address } from '@/apis/address.api'
import { ShippingMethod } from '@/apis/checkout.api'
import { useQueryClient } from '@tanstack/react-query'
import { handleMutationError } from '@/utils/mutationErrorHandler'
import { useCreditCardPayment } from '@/components/checkout/CreditCardPayment'
import { useEWalletPayment } from '@/components/checkout/EWalletPayment'

export default function CheckoutScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { purchase_ids, selectedAddressId: returnedAddressId } = useLocalSearchParams<{
    purchase_ids: string
    selectedAddressId?: string
  }>()

  const purchaseIds = purchase_ids ? purchase_ids.split(',') : []

  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null)
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('cod')
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [useCoins, setUseCoins] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  const { data: addressesData } = useAddresses()
  const { data: shippingData } = useShippingMethods()
  const { data: paymentData } = usePaymentMethods()
  const { data: summaryData, isPending: isSummarizing } = useCheckoutSummary({
    addressId: selectedAddressId ?? '',
    voucherId: voucherCode || undefined,
    useCoins,
    cartItemIds: purchaseIds,
    shippingMethodId: selectedShippingId ?? undefined,
  })
  const { mutate: createOrder, isPending: isCreatingCod } = useCreateOrder()
  const { mutate: applyVoucher, isPending: isApplyingVoucher } = useApplyVoucher()

  // Payment method hooks
  const { pay: payCreditCard, isProcessing: isProcessingCard } = useCreditCardPayment()
  const { pay: payEWallet, isProcessing: isProcessingEWallet } = useEWalletPayment()

  const addresses = addressesData?.data ?? []
  const shippingMethods = shippingData?.data ?? []
  const paymentMethods = paymentData?.data ?? []
  const summary = summaryData?.data

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a: Address) => a.is_default) ?? addresses[0]
      setSelectedAddressId(defaultAddr._id)
    }
  }, [addresses])

  useEffect(() => {
    if (returnedAddressId) setSelectedAddressId(returnedAddressId)
  }, [returnedAddressId])

  useEffect(() => {
    if (shippingMethods.length > 0 && !selectedShippingId) {
      setSelectedShippingId(shippingMethods[0]._id)
    }
  }, [shippingMethods])

  const coinBalance = summary?.coin_balance ?? 0

  const selectedAddress = addresses.find((a: Address) => a._id === selectedAddressId) ?? null
  const selectedShipping = shippingMethods.find((s: ShippingMethod) => s._id === selectedShippingId)

  const subtotal = summary?.subtotal ?? 0
  const shippingFee = summary?.shipping_fee ?? (selectedShipping?.fee ?? 0)
  const voucherDiscount = summary?.voucher_discount ?? 0
  const coinDiscount = summary?.coins_discount ?? 0
  const total = summary?.total ?? (subtotal + shippingFee - voucherDiscount - coinDiscount)

  // Combined loading state across all payment methods
  const isCreating = isCreatingCod || isProcessingCard || isProcessingEWallet

  const handlePlaceOrder = () => {
    if (!selectedAddressId) return

    const shippingMethodId = selectedShippingId ?? ''

    if (selectedPaymentId === 'credit_card') {
      // Stripe PaymentSheet flow
      payCreditCard({
        purchaseIds,
        shippingAddressId: selectedAddressId,
        shippingMethodId,
        voucherCode: voucherCode || undefined,
        coinsUsed: useCoins ? coinBalance : 0,
      })
      return
    }

    if (selectedPaymentId === 'momo' || selectedPaymentId === 'vnpay') {
      // E-wallet redirect flow
      payEWallet({
        purchaseIds,
        shippingAddressId: selectedAddressId,
        shippingMethodId,
        provider: selectedPaymentId as 'momo' | 'vnpay',
        voucherCode: voucherCode || undefined,
        coinsUsed: useCoins ? coinBalance : 0,
      })
      return
    }

    // COD / bank_transfer — existing flow
    createOrder(
      {
        purchase_ids: purchaseIds,
        address_id: selectedAddressId,
        shipping_method_id: shippingMethodId,
        payment_method: selectedPaymentId,
        voucher_code: voucherCode || undefined,
        coins_used: useCoins ? coinBalance : 0,
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: ['cart'] })
          const orderId = (data as { data?: { order_id?: string } })?.data?.order_id
          router.replace({ pathname: '/order-success', params: { orderId } })
        },
        onError: handleMutationError,
      }
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('checkout.header.title'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
          <CheckoutAddressCard
            address={selectedAddress}
            onChangeAddress={() =>
              router.push({ pathname: '/addresses', params: { mode: 'select' } })
            }
          />
          {shippingMethods.length > 0 && (
            <ShippingMethodSelector
              methods={shippingMethods}
              selectedId={selectedShippingId}
              onSelect={setSelectedShippingId}
            />
          )}
          <PaymentMethodSelector
            methods={paymentMethods.length > 0 ? paymentMethods : undefined}
            selectedId={selectedPaymentId}
            onSelect={setSelectedPaymentId}
          />
          <VoucherInput
            onApply={(code) => {
              setVoucherError('')
              applyVoucher(
                { code, orderValue: subtotal },
                {
                  onSuccess: () => setVoucherCode(code),
                  onError: () => setVoucherError(t('vouchers.code.notFound')),
                }
              )
            }}
            onRemove={() => { setVoucherCode(''); setVoucherError('') }}
            isValidating={isApplyingVoucher}
            appliedDiscount={voucherDiscount}
            errorMessage={voucherError}
          />
          <CoinsToggle coinBalance={coinBalance} enabled={useCoins} onToggle={setUseCoins} />
          <PriceBreakdown
            subtotal={subtotal}
            shippingFee={shippingFee}
            voucherDiscount={voucherDiscount}
            coinDiscount={coinDiscount}
            total={total}
          />
        </ScrollView>
        </KeyboardAvoidingView>

        <CheckoutFooter
          total={total}
          isSummarizing={isSummarizing}
          isCreating={isCreating}
          hasAddress={!!selectedAddressId}
          onPlaceOrder={handlePlaceOrder}
        />
      </SafeAreaView>
    </>
  )
}
