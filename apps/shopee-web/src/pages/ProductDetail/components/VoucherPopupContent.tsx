import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDiscount } from 'src/utils/utils'
import useVoucherSave from 'src/hooks/useVoucherSave'
import Button from 'src/components/Button'

type VoucherSaveData = ReturnType<typeof useVoucherSave>

interface VoucherPopupContentProps {
  /** Pre-fetched voucher data from parent — avoids duplicate hook instance */
  voucherData?: VoucherSaveData
}

const VoucherPopupContent = ({ voucherData }: VoucherPopupContentProps) => {
  const { t } = useTranslation('product')
  const fallback = useVoucherSave({ enabled: !voucherData })
  const { vouchers, isLoading, isError, refetch, savedIds, savingIds, handleSave } =
    voucherData ?? fallback

  return (
    <div className="w-[min(28rem,calc(100vw-2rem))] rounded-lg border border-gray-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-800">
      {/* Header */}
      <div className="border-b border-gray-100 px-4 py-2.5 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('voucher.modalTitle')}
        </h3>
      </div>

      {/* Content — compact rows */}
      <div
        className="max-h-96 overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange"
        tabIndex={0}
        role="region"
        aria-label={t('voucher.modalTitle')}
        aria-busy={isLoading}
        aria-live="polite"
      >
        {isLoading && (
          <div className="space-y-0 divide-y divide-gray-50 dark:divide-slate-700/50">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                <div className="h-4 w-12 animate-pulse motion-reduce:animate-none rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-3 w-32 flex-1 animate-pulse motion-reduce:animate-none rounded bg-gray-200 dark:bg-slate-700" />
                <div className="h-6 w-10 animate-pulse motion-reduce:animate-none rounded bg-gray-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('voucher.loadError')}</p>
            <button
              onClick={() => refetch()}
              className="min-h-11 rounded-sm bg-orange px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-orange/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange"
            >
              {t('voucher.retry')}
            </button>
          </div>
        )}

        {!isLoading && !isError && vouchers.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('voucher.noVouchers')}</p>
          </div>
        )}

        {!isLoading && !isError && vouchers.length > 0 && (
          <ul className="divide-y divide-gray-50 dark:divide-slate-700/50" role="list">
            {vouchers.map((voucher) => {
              const isSaved = savedIds.has(voucher._id)
              const isSaving = savingIds.has(voucher._id)
              return (
                <li
                  key={voucher._id}
                  className="flex items-center gap-3 px-4 py-2.5"
                  role="listitem"
                >
                  {/* Discount badge */}
                  <span className="shrink-0 rounded-sm bg-orange/10 px-2 py-0.5 text-xs font-semibold text-orange dark:bg-orange-400/10 dark:text-orange-400">
                    {formatDiscount(voucher.discount_type, voucher.discount_value)}
                  </span>
                  {/* Voucher name + description + condition */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-800 dark:text-gray-200">
                      {voucher.name}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {voucher.description}
                    </p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {t('voucher.minOrder', { amount: formatCurrency(voucher.min_order_value) })}
                    </p>
                  </div>
                  {/* Save button */}
                  <Button
                    type="button"
                    onClick={() => !isSaved && !isSaving && handleSave(voucher._id)}
                    disabled={isSaved || isSaving}
                    aria-label={
                      isSaved
                        ? t('voucher.ariaSaved', { name: voucher.name })
                        : t('voucher.ariaSave', {
                            name: voucher.name,
                            discount: formatDiscount(voucher.discount_type, voucher.discount_value),
                          })
                    }
                    aria-disabled={isSaved || isSaving}
                    animated={false}
                    className={
                      isSaved
                        ? 'min-h-11 cursor-not-allowed rounded-sm border border-gray-300 px-3 py-2 text-xs text-gray-400 dark:border-slate-600 dark:text-gray-500'
                        : 'min-h-11 rounded-sm bg-orange px-3 py-2 text-xs font-medium text-white hover:bg-orange/90'
                    }
                  >
                    {isSaving
                      ? t('voucher.processing')
                      : isSaved
                        ? t('voucher.saved')
                        : t('voucher.save')}
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default VoucherPopupContent
