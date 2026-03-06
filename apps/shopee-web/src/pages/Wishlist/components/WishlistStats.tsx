import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { formatCurrency } from 'src/utils/utils'
import { IconChartBar, IconCurrencyDollar, IconHeart, IconTag } from './WishlistIcons'

interface WishlistStatsProps {
  itemCount: number
  totalValue: number
  totalSavings: number
  avgDiscount: number
  itemVariants: any
  containerVariants: any
  isMobile: boolean
}

export default function WishlistStats({
  itemCount,
  totalValue,
  totalSavings,
  avgDiscount,
  itemVariants,
  containerVariants,
  isMobile
}: WishlistStatsProps) {
  const { t } = useTranslation('wishlist')
  return (
    <motion.div
      variants={containerVariants}
      initial={isMobile ? false : 'hidden'}
      animate={isMobile ? undefined : 'visible'}
      className='mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4'
    >
      <motion.div
        variants={itemVariants}
        className='flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50'
      >
        <div className='flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-orange-400 to-red-500 text-white shadow-xs shadow-orange-500/30'>
          <IconHeart className='h-5 w-5' />
        </div>
        <div>
          <div className='text-xl font-bold text-gray-800 dark:text-gray-100'>{itemCount}</div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>{t('stats.favorites')}</div>
        </div>
      </motion.div>
      <motion.div
        variants={itemVariants}
        className='flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50'
      >
        <div className='flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-blue-400 to-indigo-500 text-white shadow-xs shadow-blue-500/30'>
          <IconCurrencyDollar className='h-5 w-5' />
        </div>
        <div>
          <div className='text-xl font-bold text-gray-800 dark:text-gray-100'>₫{formatCurrency(totalValue)}</div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>{t('stats.totalValue')}</div>
        </div>
      </motion.div>
      <motion.div
        variants={itemVariants}
        className='flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50'
      >
        <div className='flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-emerald-400 to-teal-500 text-white shadow-xs shadow-emerald-500/30'>
          <IconTag className='h-5 w-5' />
        </div>
        <div>
          <div className='text-xl font-bold text-emerald-500 dark:text-emerald-400'>
            ₫{formatCurrency(totalSavings)}
          </div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>{t('stats.savings')}</div>
        </div>
      </motion.div>
      <motion.div
        variants={itemVariants}
        className='flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:shadow-slate-900/50'
      >
        <div className='flex h-11 w-11 items-center justify-center rounded-full bg-linear-to-br from-violet-400 to-purple-500 text-white shadow-xs shadow-violet-500/30'>
          <IconChartBar className='h-5 w-5' />
        </div>
        <div>
          <div className='text-xl font-bold text-gray-800 dark:text-gray-100'>{avgDiscount}%</div>
          <div className='text-xs text-gray-500 dark:text-gray-400'>{t('stats.avgDiscount')}</div>
        </div>
      </motion.div>
    </motion.div>
  )
}
