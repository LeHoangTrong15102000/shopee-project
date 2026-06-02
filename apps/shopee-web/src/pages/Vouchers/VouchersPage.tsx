import { useContext, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { useTranslation } from 'react-i18next'
import voucherApi from 'src/apis/voucher.api'
import VoucherCard from 'src/components/VoucherCard'
import SEO from 'src/components/SEO'
import { AppContext } from 'src/contexts/app.context'
import path from 'src/constant/path'

// Loading skeleton for voucher grid
const VoucherSkeleton = () => (
  <div className="flex overflow-hidden rounded-lg bg-white shadow-xs dark:bg-slate-800">
    <div className="h-20 w-20 animate-pulse bg-gray-200 sm:w-24 dark:bg-slate-700" />
    <div className="flex flex-1 flex-col justify-between p-3">
      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
    </div>
  </div>
)

export default function VouchersPage() {
  const { isAuthenticated } = useContext(AppContext)
  const navigate = useNavigate()
  const { t } = useTranslation('voucher')

  // Track which vouchers have been collected in this session
  const [collectedIds, setCollectedIds] = useState<Set<string>>(new Set())

  const { data: vouchersData, isLoading } = useQuery({
    queryKey: ['vouchers', 'available'],
    queryFn: () => voucherApi.getVouchers({ status: 'active' }),
    staleTime: 2 * 60 * 1000,
  })

  const collectMutation = useMutation({
    mutationFn: (voucherId: string) => voucherApi.collectVoucher(voucherId),
    onSuccess: (_data, voucherId) => {
      setCollectedIds((prev) => new Set([...prev, voucherId]))
      toast.success(t('toast.collectSuccess'))
    },
    onError: () => {
      toast.error(t('toast.collectError'))
    },
  })

  const vouchers = vouchersData?.data?.data?.vouchers || []

  const handleCollect = (voucherId: string) => {
    if (!isAuthenticated) {
      navigate(path.login)
      return
    }
    collectMutation.mutate(voucherId)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-slate-900">
      <SEO title={t('page.title')} description={t('page.description')} />

      <div className="container py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('heading')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('page.subtitle')}</p>
        </div>

        {/* Skeleton loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <VoucherSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && vouchers.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg bg-white py-16 shadow-sm dark:bg-slate-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="mb-4 h-16 w-16 text-gray-300 dark:text-slate-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 010-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z"
              />
            </svg>
            <p className="text-gray-400 dark:text-gray-500">{t('empty')}</p>
          </div>
        )}

        {/* Voucher grid */}
        {!isLoading && vouchers.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vouchers.map((voucher) => {
              const isCollected = collectedIds.has(voucher._id) || voucher.is_collected
              return (
                <VoucherCard
                  key={voucher._id}
                  voucher={voucher}
                  isSaved={isCollected}
                  onSave={handleCollect}
                  isLoading={collectMutation.isPending && collectMutation.variables === voucher._id}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
