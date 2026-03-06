import { motion, AnimatePresence } from 'framer-motion'
import { panelVariants } from '../orderSearchFilter.constants'

interface FilterPanelProps {
  isOpen: boolean
  reducedMotion: boolean
  dateFrom: string
  dateTo: string
  priceMin: string
  priceMax: string
  onDateFromChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDateToChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPriceMinChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onPriceMaxChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function FilterPanel({
  isOpen,
  reducedMotion,
  dateFrom,
  dateTo,
  priceMin,
  priceMax,
  onDateFromChange,
  onDateToChange,
  onPriceMinChange,
  onPriceMaxChange
}: FilterPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={reducedMotion ? undefined : panelVariants}
          initial='hidden'
          animate='visible'
          exit='exit'
          className='overflow-hidden'
        >
          <div className='mt-4 rounded-xs border border-gray-200 bg-gray-50/50 p-4 dark:border-slate-700 dark:bg-slate-900/50'>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Date Range Filter */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
                  Khoảng thời gian
                </label>
                <div className='flex items-center gap-2'>
                  <div className='flex-1'>
                    <input
                      type='date'
                      value={dateFrom}
                      onChange={onDateFromChange}
                      className='w-full rounded-xs border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d] focus:outline-hidden dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100'
                      aria-label='Từ ngày'
                    />
                  </div>
                  <span className='text-gray-400 dark:text-gray-500'>-</span>
                  <div className='flex-1'>
                    <input
                      type='date'
                      value={dateTo}
                      onChange={onDateToChange}
                      className='w-full rounded-xs border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 transition-colors focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d] focus:outline-hidden dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100'
                      aria-label='Đến ngày'
                    />
                  </div>
                </div>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>Khoảng giá</label>
                <div className='flex items-center gap-2'>
                  <div className='relative flex-1'>
                    <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400 dark:text-gray-500'>
                      ₫
                    </span>
                    <input
                      type='number'
                      value={priceMin}
                      onChange={onPriceMinChange}
                      placeholder='Từ'
                      min='0'
                      className='w-full rounded-xs border border-gray-300 bg-white py-2 pr-3 pl-7 text-sm text-gray-900 transition-colors focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d] focus:outline-hidden dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100'
                      aria-label='Giá tối thiểu'
                    />
                  </div>
                  <span className='text-gray-400 dark:text-gray-500'>-</span>
                  <div className='relative flex-1'>
                    <span className='absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-400 dark:text-gray-500'>
                      ₫
                    </span>
                    <input
                      type='number'
                      value={priceMax}
                      onChange={onPriceMaxChange}
                      placeholder='Đến'
                      min='0'
                      className='w-full rounded-xs border border-gray-300 bg-white py-2 pr-3 pl-7 text-sm text-gray-900 transition-colors focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d] focus:outline-hidden dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100'
                      aria-label='Giá tối đa'
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
