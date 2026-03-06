const ProductSkeleton = () => {
  return (
    <div className='h-full min-h-[280px] overflow-hidden rounded-xs bg-white shadow-sm dark:bg-slate-800'>
      {/* Image skeleton */}
      <div className='relative w-full animate-pulse bg-gray-200 pt-[100%] dark:bg-slate-700' />

      {/* Content skeleton */}
      <div className='p-2'>
        {/* Name skeleton - 2 lines */}
        <div className='min-h-[1.9rem] space-y-1'>
          <div className='h-3 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
          <div className='h-3 w-3/4 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
        </div>

        {/* Price skeleton */}
        <div className='mt-3 flex items-center gap-2'>
          <div className='h-4 w-16 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
          <div className='h-4 w-20 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
        </div>

        {/* Rating + sold skeleton */}
        <div className='mt-3 flex items-center gap-2'>
          <div className='h-3 w-20 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
          <div className='h-3 w-16 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
        </div>
      </div>

      {/* Location skeleton */}
      <div className='p-2'>
        <div className='h-3 w-24 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' />
      </div>
    </div>
  )
}

export default ProductSkeleton
