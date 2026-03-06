export const SecurityBadge = () => (
  <div className='mt-4 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2.5 transition-all dark:border-slate-600 dark:bg-slate-700/50'>
    <div className='flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500'>
      <svg className='h-3 w-3 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2.5}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z'
        />
      </svg>
    </div>
    <span className='text-xs font-medium text-gray-600 sm:text-sm dark:text-gray-300'>
      Thanh toán an toàn & bảo mật
    </span>
  </div>
)

export const PaymentIcons = () => (
  <div className='flex flex-wrap items-center justify-center gap-2 md:gap-3'>
    <div className='flex h-8 items-center rounded-lg bg-linear-to-r from-blue-50 to-blue-100 px-3 shadow-xs ring-1 ring-blue-200/50 transition-all hover:shadow-md hover:ring-blue-300 md:h-9 dark:from-blue-900/30 dark:to-blue-800/30 dark:shadow-slate-900/50 dark:ring-blue-700/50 dark:hover:ring-blue-600'>
      <span className='text-xs font-bold text-blue-600 dark:text-blue-300'>VISA</span>
    </div>
    <div className='flex h-8 items-center rounded-lg bg-linear-to-r from-red-50 to-orange-50 px-3 shadow-xs ring-1 ring-red-200/50 transition-all hover:shadow-md hover:ring-red-300 md:h-9 dark:from-red-900/30 dark:to-orange-900/30 dark:shadow-slate-900/50 dark:ring-red-700/50 dark:hover:ring-red-600'>
      <span className='text-xs font-bold text-red-500 dark:text-red-300'>Master</span>
    </div>
    <div className='flex h-8 items-center rounded-lg bg-linear-to-r from-blue-50 to-indigo-50 px-3 shadow-xs ring-1 ring-blue-200/50 transition-all hover:shadow-md hover:ring-blue-300 md:h-9 dark:from-blue-900/30 dark:to-indigo-900/30 dark:shadow-slate-900/50 dark:ring-blue-700/50 dark:hover:ring-blue-600'>
      <span className='text-xs font-bold text-blue-800 dark:text-blue-200'>JCB</span>
    </div>
    <div className='flex h-8 items-center rounded-lg bg-linear-to-r from-pink-50 to-rose-100 px-3 shadow-xs ring-1 ring-pink-200/50 transition-all hover:shadow-md hover:ring-pink-300 md:h-9 dark:from-pink-900/30 dark:to-rose-900/30 dark:shadow-slate-900/50 dark:ring-pink-700/50 dark:hover:ring-pink-600'>
      <span className='text-xs font-bold text-pink-600 dark:text-pink-300'>MoMo</span>
    </div>
    <div className='flex h-8 items-center rounded-lg bg-linear-to-r from-blue-50 to-cyan-50 px-3 shadow-xs ring-1 ring-blue-200/50 transition-all hover:shadow-md hover:ring-blue-300 md:h-9 dark:from-blue-900/30 dark:to-cyan-900/30 dark:shadow-slate-900/50 dark:ring-blue-700/50 dark:hover:ring-blue-600'>
      <span className='text-xs font-bold text-blue-500 dark:text-blue-300'>ZaloPay</span>
    </div>
    <div className='flex h-8 items-center rounded-lg bg-linear-to-r from-blue-50 to-indigo-100 px-3 shadow-xs ring-1 ring-blue-200/50 transition-all hover:shadow-md hover:ring-blue-300 md:h-9 dark:from-blue-900/30 dark:to-indigo-900/30 dark:shadow-slate-900/50 dark:ring-blue-700/50 dark:hover:ring-blue-600'>
      <span className='text-xs font-bold text-blue-700 dark:text-blue-200'>VNPay</span>
    </div>
  </div>
)

export const TrustIndicators = () => (
  <div className='mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 dark:border-slate-700'>
    <div className='flex flex-col items-center gap-1.5 rounded-lg bg-linear-to-b from-blue-50 to-white p-2 dark:from-blue-900/30 dark:to-slate-800'>
      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-cyan-500 shadow-xs shadow-blue-500/30 dark:shadow-slate-900/50'>
        <svg className='h-5 w-5 text-white' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
          <path
            fillRule='evenodd'
            d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      <span className='text-center text-[10px] font-medium text-gray-600 md:text-xs dark:text-gray-300'>
        Chính hãng
      </span>
    </div>
    <div className='flex flex-col items-center gap-1.5 rounded-lg bg-linear-to-b from-green-50 to-white p-2 dark:from-green-900/30 dark:to-slate-800'>
      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-green-500 to-emerald-500 shadow-xs shadow-green-500/30 dark:shadow-slate-900/50'>
        <svg className='h-5 w-5 text-white' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
          <path
            fillRule='evenodd'
            d='M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z'
            clipRule='evenodd'
          />
        </svg>
      </div>
      <span className='text-center text-[10px] font-medium text-gray-600 md:text-xs dark:text-gray-300'>
        Đổi trả 7 ngày
      </span>
    </div>
    <div className='flex flex-col items-center gap-1.5 rounded-lg bg-linear-to-b from-orange-50 to-white p-2 dark:from-orange-900/30 dark:to-slate-800'>
      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-r from-orange-500 to-amber-500 shadow-xs shadow-orange-500/30 dark:shadow-slate-900/50'>
        <svg className='h-5 w-5 text-white' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
          <path d='M11.983 1.907a.75.75 0 00-1.292-.657l-8.5 9.5A.75.75 0 002.75 12h6.572l-1.305 6.093a.75.75 0 001.292.657l8.5-9.5A.75.75 0 0017.25 8h-6.572l1.305-6.093z' />
        </svg>
      </div>
      <span className='text-center text-[10px] font-medium text-gray-600 md:text-xs dark:text-gray-300'>
        Giao nhanh
      </span>
    </div>
  </div>
)
