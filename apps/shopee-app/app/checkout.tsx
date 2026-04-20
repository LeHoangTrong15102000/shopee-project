import React, { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { AppText, AppButton } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import {
  useCheckoutSummary,
  useShippingMethods,
  usePaymentMethods,
  useCreateOrder,
} from '@/hooks/useCheckout'
import { useAddresses } from '@/hooks/useAddresses'
import { formatPrice } from '@/utils/price'
import CheckoutAddressCard from '@/components/checkout/CheckoutAddressCard'
import ShippingMethodSelector from '@/components/checkout/ShippingMethodSelector'
import PaymentMethodSelector from '@/components/checkout/PaymentMethodSelector'
import VoucherInput from '@/components/checkout/VoucherInput'
import CoinsToggle from '@/components/checkout/CoinsToggle'
import PriceBreakdown from '@/components/checkout/PriceBreakdown'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function CheckoutScreen() {
  const colors = useColors()
  const router = useRouter()
  const { purchase_ids, selectedAddressId: returnedAddressId } = useLocalSearchParams<{ purchase_ids: string; selectedAddressId?: string }>()

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
  const { mutate: checkoutSummary, data: summaryData, isPending: isSummarizing } = useCheckoutSummary()
  const { mutate: createOrder, isPending: isCreating } = useCreateOrder()

  const addresses = addressesData?.data ?? []
  const shippingMethods = shippingData?.data ?? []
  const paymentMethods = paymentData?.data ?? []
  const summary = summaryData?.data

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a: any) => a.is_default) ?? addresses[0]
      setSelectedAddressId(defaultAddr._id)
    }
  }, [addresses])

  // Pick up address selected from addresses screen
  useEffect(() => {
    if (returnedAddressId) {
      setSelectedAddressId(returnedAddressId)
    }
  }, [returnedAddressId])

  // Auto-select first shipping method
  useEffect(() => {
    if (shippingMethods.length > 0 && !selectedShippingId) {
      setSelectedShippingId(shippingMethods[0]._id)
    }
  }, [shippingMethods])

  // Refetch checkout summary when params change
  useEffect(() => {
    if (purchaseIds.length > 0 && selectedShippingId) {
      checkoutSummary({
        purchase_ids: purchaseIds,
        shipping_method_id: selectedShippingId,
        voucher_code: voucherCode || undefined,
        coins_used: useCoins ? coinBalance : 0,
      })
    }
  }, [purchaseIds.join(','), selectedShippingId, voucherCode, useCoins])

  const selectedAddress = addresses.find((a: any) => a._id === selectedAddressId) ?? null
  const selectedShipping = shippingMethods.find((s: any) => s._id === selectedShippingId)

  const subtotal = summary?.subtotal ?? 0
  const shippingFee = summary?.shipping_fee ?? (selectedShipping?.fee ?? 0)
  const voucherDiscount = summary?.voucher_discount ?? 0
  const coinDiscount = summary?.coins_discount ?? 0
  const total = summary?.total ?? (subtotal + shippingFee - voucherDiscount - coinDiscount)
  const coinBalance = summary?.coin_balance ?? 0

  const handleApplyVoucher = (code: string) => {
    setVoucherCode(code)
    setVoucherError('')
  }

  const handlePlaceOrder = () => {
    if (!selectedAddressId) return

    createOrder(
      {
        purchase_ids: purchaseIds,
        address_id: selectedAddressId,
        shipping_method_id: selectedShippingId ?? '',
        payment_method: selectedPaymentId,
        voucher_code: voucherCode || undefined,
        coins_used: useCoins ? coinBalance : 0,
      },
      {
        onSuccess: (data: any) => {
          const orderId = data?.data?.order_id
          router.replace({ pathname: '/order-success', params: { orderId } })
        },
        onError: () => {},
      }
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Thanh toán',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}>
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
            onApply={handleApplyVoucher}
            appliedDiscount={voucherDiscount}
            errorMessage={voucherError}
          />

          <CoinsToggle
            coinBalance={coinBalance}
            enabled={useCoins}
            onToggle={setUseCoins}
          />

          <PriceBreakdown
            subtotal={subtotal}
            shippingFee={shippingFee}
            voucherDiscount={voucherDiscount}
            coinDiscount={coinDiscount}
            total={total}
          />
        </ScrollView>

        {/* Sticky bottom bar */}
        <View
          className="border-t border-neutrals900 bg-background px-4 py-3"
          style={{ paddingBottom: 16 }}>
          <View className="flex-row items-center justify-between mb-3">
            <AppText raw variant="bodySmall" color="muted">
              Tổng thanh toán
            </AppText>
            <AppText raw variant="body" weight="bold" color="primary">
              {isSummarizing ? '...' : formatPrice(total)}
            </AppText>
          </View>
          <AppButton
            variant="primary"
            onPress={handlePlaceOrder}
            loading={isCreating}
            disabled={isCreating || !selectedAddressId}
            className="w-full">
            Đặt hàng
          </AppButton>
        </View>

        {/* Loading overlay during order creation */}
        {isCreating && (
          <View
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.4)',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View
              style={{
                backgroundColor: colors.neutrals1000,
                padding: 24,
                borderRadius: 12,
                alignItems: 'center',
                gap: 12,
              }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <AppText raw variant="body">
                Đang đặt hàng...
              </AppText>
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  )
}
