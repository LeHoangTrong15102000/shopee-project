import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { PaymentMethod, PaymentMethodType, EWalletProvider } from 'src/types/checkout.type'
import checkoutApi from 'src/apis/checkout.api'
import { PaymentIcon } from 'src/components/Icons'
import Button from 'src/components/Button'

interface PaymentMethodSelectorProps {
  selectedMethodType: PaymentMethodType | null
  onSelect: (method: PaymentMethod) => void
  selectedEWalletProvider?: EWalletProvider | null
  onEWalletProviderSelect?: (provider: EWalletProvider) => void
}

function PaymentMethodSelector({
  selectedMethodType,
  onSelect,
  selectedEWalletProvider,
  onEWalletProviderSelect,
}: PaymentMethodSelectorProps) {
  const { t } = useTranslation('payment')
  const { data: methodsData, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const res = await checkoutApi.getPaymentMethods()
      return res.data.data
    },
  })

  const methods = methodsData || []

  // Helper function to convert snake_case to camelCase for translation keys
  const toCamelCase = (str: string) => {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-200 dark:bg-slate-700" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Title removed - using SectionHeader in parent */}

      <div className="space-y-3">
        {methods.map((method: PaymentMethod) => (
          <motion.div
            key={method._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`cursor-pointer rounded-lg border-2 bg-white p-3 transition-all md:p-4 dark:bg-slate-800 ${
              !method.isAvailable
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50 dark:border-slate-700 dark:bg-slate-900'
                : selectedMethodType === method.type
                  ? 'border-orange'
                  : 'border-gray-200 hover:border-gray-300 dark:border-slate-600 dark:hover:border-slate-500'
            }`}
            onClick={() => method.isAvailable && onSelect(method)}
            role="button"
            tabIndex={method.isAvailable ? 0 : -1}
            aria-pressed={selectedMethodType === method.type}
            aria-disabled={!method.isAvailable}
            onKeyDown={(e) => e.key === 'Enter' && method.isAvailable && onSelect(method)}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                  selectedMethodType === method.type
                    ? 'border-orange'
                    : 'border-gray-300 dark:border-slate-500'
                }`}
              >
                {selectedMethodType === method.type && (
                  <div className="h-3 w-3 rounded-full bg-orange" />
                )}
              </div>

              <div className="flex items-center gap-3 text-orange">
                <PaymentIcon type={method.type} className="h-6 w-6" />
                <div>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {t(`method.${toCamelCase(method.type)}` as any)}
                  </span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t(`method.${toCamelCase(method.type)}Desc` as any)}
                  </p>
                </div>
              </div>

              {!method.isAvailable && (
                <span className="ml-auto rounded-sm bg-gray-200 px-2 py-1 text-xs text-gray-600 dark:bg-slate-700 dark:text-gray-400">
                  {t('methodSelector.unavailable')}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {selectedMethodType === 'bank_transfer' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/30"
        >
          <h4 className="font-medium text-blue-900 dark:text-blue-300">
            {t('methodSelector.bankTransferInfo')}
          </h4>
          <div className="mt-2 space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <p>
              {t('methodSelector.bank')}: <span className="font-medium">Vietcombank</span>
            </p>
            <p>
              {t('methodSelector.accountNumber')}: <span className="font-medium">1234567890</span>
            </p>
            <p>
              {t('methodSelector.accountHolder')}: <span className="font-medium">SHOPEE CLONE</span>
            </p>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-400">
              * {t('methodSelector.transferNote')}
            </p>
          </div>
        </motion.div>
      )}

      {selectedMethodType === 'e_wallet' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="rounded-xl bg-linear-to-br from-purple-50 via-white to-pink-50 p-4 ring-1 ring-purple-100 dark:from-purple-900/30 dark:via-slate-800 dark:to-pink-900/30 dark:ring-purple-800"
        >
          <h4 className="font-medium text-purple-900 dark:text-purple-300">
            {t('methodSelector.selectEWallet')}
          </h4>
          <div className="mt-3 flex gap-3">
            <Button
              animated={false}
              onClick={() => onEWalletProviderSelect?.('momo')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                selectedEWalletProvider === 'momo'
                  ? 'bg-linear-to-r from-pink-600 to-rose-600 shadow-pink-600/40 ring-2 ring-pink-400'
                  : 'bg-linear-to-r from-pink-500 to-rose-500 shadow-pink-500/30 hover:shadow-pink-500/40'
              }`}
              aria-pressed={selectedEWalletProvider === 'momo'}
            >
              MoMo
            </Button>
            <Button
              animated={false}
              disabled
              className="flex-1 cursor-not-allowed rounded-xl bg-linear-to-r from-blue-300 to-cyan-300 px-4 py-2.5 text-sm font-medium text-white opacity-50 shadow-lg shadow-blue-300/30"
              title="ZaloPay chưa được hỗ trợ"
            >
              ZaloPay
            </Button>
            <Button
              animated={false}
              onClick={() => onEWalletProviderSelect?.('vnpay')}
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl ${
                selectedEWalletProvider === 'vnpay'
                  ? 'bg-linear-to-r from-blue-700 to-indigo-700 shadow-blue-700/40 ring-2 ring-blue-400'
                  : 'bg-linear-to-r from-blue-600 to-indigo-600 shadow-blue-600/30 hover:shadow-blue-600/40'
              }`}
              aria-pressed={selectedEWalletProvider === 'vnpay'}
            >
              VNPay
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default PaymentMethodSelector
