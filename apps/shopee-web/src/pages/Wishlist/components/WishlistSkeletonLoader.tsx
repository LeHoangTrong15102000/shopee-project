export default function WishlistSkeletonLoader() {
  return (
    <div className='border-b-4 border-b-[#ee4d2d] bg-neutral-100 py-16 dark:bg-slate-900'>
      <div className='container'>
        {/* Skeleton Stats Header */}
        <div className='mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3'>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className='flex items-center gap-4 rounded-lg bg-white p-4 shadow-xs dark:bg-slate-800 dark:shadow-slate-900/50'
            >
              <div className='h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700' />
              <div className='flex-1'>
                <div className='mb-2 h-6 w-20 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
                <div className='h-4 w-24 animate-pulse rounded-sm bg-gray-100 dark:bg-slate-600' />
              </div>
            </div>
          ))}
        </div>
        {/* Skeleton Filter Pills */}
        <div className='mb-6 flex gap-2 overflow-x-auto pb-2'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='h-8 w-20 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-slate-700' />
          ))}
        </div>
        {/* Skeleton Product Grid */}
        <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className='overflow-hidden rounded-lg bg-white shadow-xs dark:bg-slate-800 dark:shadow-slate-900/50'
            >
              <div className='aspect-square w-full animate-pulse bg-gray-200 dark:bg-slate-700' />
              <div className='p-3'>
                <div className='mb-2 h-4 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
                <div className='mb-3 h-4 w-3/4 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
                <div className='mb-2 h-5 w-1/2 animate-pulse rounded-sm bg-gray-100 dark:bg-slate-600' />
                <div className='h-8 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
