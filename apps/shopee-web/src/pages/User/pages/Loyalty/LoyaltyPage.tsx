import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import loyaltyApi from 'src/apis/loyalty.api'
import LoyaltyPointsCard from 'src/components/LoyaltyPointsCard'
import SEO from 'src/components/SEO'
import { PointsTransaction } from 'src/types/loyalty.type'

// Loading skeleton for LoyaltyPointsCard
const CardSkeleton = () => (
  <div className="h-48 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700" />
)

// Loading skeleton for transaction rows
const TransactionRowSkeleton = () => (
  <div className="flex items-center justify-between border-b border-gray-100 py-3 dark:border-slate-700">
    <div className="flex flex-col gap-1">
      <div className="h-4 w-40 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
      <div className="h-3 w-24 animate-pulse rounded bg-gray-100 dark:bg-slate-700" />
    </div>
    <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-slate-600" />
  </div>
)

const TRANSACTION_TYPE_COLOR: Record<PointsTransaction['type'], string> = {
  earn: 'text-green-600 dark:text-green-400',
  bonus: 'text-green-600 dark:text-green-400',
  redeem: 'text-orange dark:text-orange-400',
  expire: 'text-red-500 dark:text-red-400',
}

const TRANSACTION_TYPE_PREFIX: Record<PointsTransaction['type'], string> = {
  earn: '+',
  bonus: '+',
  redeem: '-',
  expire: '-',
}

export default function LoyaltyPage() {
  const { t } = useTranslation('checkin')

  const {
    data: pointsData,
    isLoading: isPointsLoading,
    isError: isPointsError,
  } = useQuery({
    queryKey: ['loyalty', 'points'],
    queryFn: () => loyaltyApi.getPoints(),
    staleTime: 60 * 1000,
  })

  const { data: transactionsData, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['loyalty', 'transactions'],
    queryFn: () => loyaltyApi.getTransactions({ limit: 20 }),
    staleTime: 60 * 1000,
  })

  const points = pointsData?.data?.data
  const transactions = transactionsData?.data?.data?.transactions || []

  return (
    <div className="rounded-xs bg-white px-2 pb-10 shadow-sm md:px-7 md:pb-20 dark:bg-slate-800">
      <SEO title={t('loyalty.title')} noindex />

      <div className="border-b border-b-gray-200 py-6 dark:border-b-slate-700">
        <h1 className="text-lg font-medium capitalize text-gray-900 dark:text-gray-100">
          {t('loyalty.title')}
        </h1>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6">
        {/* Points Card */}
        {isPointsLoading && <CardSkeleton />}
        {isPointsError && !isPointsLoading && (
          <div className="w-full rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {t('loyalty.errorLoading')}
          </div>
        )}
        {points && !isPointsLoading && (
          <LoyaltyPointsCard points={points} className="w-full max-w-md" />
        )}

        {/* Transaction History */}
        <div className="w-full max-w-2xl">
          <h2 className="mb-3 text-base font-medium text-gray-900 dark:text-gray-100">
            {t('loyalty.history')}
          </h2>

          {isTransactionsLoading && (
            <div className="divide-y divide-gray-100 dark:divide-slate-700">
              {Array.from({ length: 5 }).map((_, i) => (
                <TransactionRowSkeleton key={i} />
              ))}
            </div>
          )}

          {!isTransactionsLoading && transactions.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
              {t('loyalty.noTransactions')}
            </p>
          )}

          {!isTransactionsLoading && transactions.length > 0 && (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {transactions.map((tx) => (
                <li key={tx._id} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-gray-800 dark:text-gray-100">
                      {tx.description}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <span className={`font-semibold ${TRANSACTION_TYPE_COLOR[tx.type]}`}>
                    {TRANSACTION_TYPE_PREFIX[tx.type]}
                    {tx.points.toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
