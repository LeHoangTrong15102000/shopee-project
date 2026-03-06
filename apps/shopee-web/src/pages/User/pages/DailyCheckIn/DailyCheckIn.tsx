import SEO from 'src/components/SEO'
import DailyCheckIn from 'src/components/DailyCheckIn'

// SVG Icon Components for reward tiers
const BronzeShieldIcon = () => (
  <svg viewBox='0 0 24 24' fill='none' className='mx-auto h-8 w-8 text-amber-600 dark:text-amber-400'>
    <path d='M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z' fill='currentColor' opacity='0.15' />
    <path
      d='M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path d='M9 12l2 2 4-4' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
  </svg>
)

const SilverStarIcon = () => (
  <svg viewBox='0 0 24 24' fill='none' className='mx-auto h-8 w-8 text-slate-500 dark:text-slate-300'>
    <path
      d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
      fill='currentColor'
      opacity='0.15'
    />
    <path
      d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

const GoldTrophyIcon = () => (
  <svg viewBox='0 0 24 24' fill='none' className='mx-auto h-8 w-8 text-yellow-500 dark:text-yellow-400'>
    <path d='M6 2h12v6a6 6 0 01-12 0V2z' fill='currentColor' opacity='0.15' />
    <path d='M6 2h12v6a6 6 0 01-12 0V2z' stroke='currentColor' strokeWidth='1.5' />
    <path d='M12 14v3' stroke='currentColor' strokeWidth='1.5' />
    <path d='M8 21h8' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    <path d='M9 17h6' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    <path d='M18 2v1a3 3 0 01-3 3' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
    <path d='M6 2v1a3 3 0 003 3' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
  </svg>
)

const DiamondCrownIcon = () => (
  <svg viewBox='0 0 24 24' fill='none' className='mx-auto h-8 w-8 text-violet-500 dark:text-violet-400'>
    <path d='M2 8l4-4 6 4 6-4 4 4-4 12H6L2 8z' fill='currentColor' opacity='0.15' />
    <path
      d='M2 8l4-4 6 4 6-4 4 4-4 12H6L2 8z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <circle cx='12' cy='14' r='2' fill='currentColor' opacity='0.3' />
  </svg>
)

const LightbulbIcon = () => (
  <svg viewBox='0 0 24 24' fill='none' className='mr-1 inline-block h-5 w-5 text-amber-500 dark:text-amber-400'>
    <path
      d='M9 21h6M12 3a6 6 0 00-4 10.47V17a1 1 0 001 1h6a1 1 0 001-1v-3.53A6 6 0 0012 3z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path d='M9.5 14h5' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' />
  </svg>
)

export default function DailyCheckInPage() {
  return (
    <div className='rounded-xs bg-white px-2 pb-10 shadow-sm md:px-7 md:pb-20 dark:bg-slate-800'>
      <SEO title='Điểm danh hàng ngày' description='Điểm danh hàng ngày để nhận xu và phần thưởng' noindex />

      <div className='border-b border-b-gray-200 py-6 dark:border-b-slate-700'>
        <h1 className='text-lg font-medium text-gray-900 capitalize dark:text-gray-100'>Điểm danh hàng ngày</h1>
        <div className='mt-1 text-sm text-gray-700 dark:text-gray-300'>
          Điểm danh mỗi ngày để nhận xu và phần thưởng hấp dẫn
        </div>
      </div>

      <div className='mt-8 flex flex-col items-center'>
        <DailyCheckIn className='w-full max-w-md' />

        {/* Rewards Info */}
        <div className='mt-8 w-full max-w-2xl'>
          <h2 className='mb-4 text-base font-medium text-gray-900 dark:text-gray-100'>
            Phần thưởng theo chuỗi điểm danh
          </h2>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
            <div className='relative overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-4 text-center transition-all duration-300 dark:border-amber-700/50 dark:bg-amber-950/30'>
              <div className='absolute inset-0 bg-linear-to-br from-amber-100/50 to-transparent dark:from-amber-800/10' />
              <div className='relative mb-2'>
                <BronzeShieldIcon />
              </div>
              <div className='relative font-semibold text-gray-900 dark:text-gray-100'>3 ngày</div>
              <div className='relative text-sm font-bold text-amber-600 dark:text-amber-400'>x1.5 xu</div>
            </div>
            <div className='relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 text-center transition-all duration-300 dark:border-slate-600/50 dark:bg-slate-700/50'>
              <div className='absolute inset-0 bg-linear-to-br from-slate-100/50 to-transparent dark:from-slate-600/10' />
              <div className='relative mb-2'>
                <SilverStarIcon />
              </div>
              <div className='relative font-semibold text-gray-900 dark:text-gray-100'>7 ngày</div>
              <div className='relative text-sm font-bold text-slate-500 dark:text-slate-300'>x2 xu</div>
            </div>
            <div className='relative overflow-hidden rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center transition-all duration-300 dark:border-yellow-700/50 dark:bg-yellow-950/30'>
              <div className='absolute inset-0 bg-linear-to-br from-yellow-100/50 to-transparent dark:from-yellow-800/10' />
              <div className='relative mb-2'>
                <GoldTrophyIcon />
              </div>
              <div className='relative font-semibold text-gray-900 dark:text-gray-100'>14 ngày</div>
              <div className='relative text-sm font-bold text-yellow-500 dark:text-yellow-400'>x2.5 xu</div>
            </div>
            <div className='relative overflow-hidden rounded-xl border border-violet-200 bg-violet-50 p-4 text-center shadow-md shadow-violet-100 transition-all duration-300 dark:border-violet-500/30 dark:bg-violet-950/30 dark:shadow-violet-900/30'>
              <div className='absolute inset-0 bg-linear-to-br from-violet-100/60 via-transparent to-purple-100/40 dark:from-violet-800/15 dark:to-purple-800/10' />
              <div className='relative mb-2'>
                <DiamondCrownIcon />
              </div>
              <div className='relative font-semibold text-gray-900 dark:text-gray-100'>30 ngày</div>
              <div className='relative text-sm font-bold text-violet-500 dark:text-violet-400'>x3 xu</div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className='mt-8 w-full max-w-2xl rounded-lg bg-orange-50 p-4 dark:bg-slate-700'>
          <h3 className='mb-2 flex items-center font-medium text-gray-900 dark:text-gray-100'>
            <LightbulbIcon /> Mẹo nhỏ
          </h3>
          <ul className='space-y-1 text-sm text-gray-600 dark:text-gray-300'>
            <li>• Điểm danh liên tục để nhận thưởng cao hơn</li>
            <li>• Chuỗi điểm danh sẽ bị reset nếu bạn bỏ lỡ 1 ngày</li>
            <li>• Xu có thể dùng để đổi voucher giảm giá</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
