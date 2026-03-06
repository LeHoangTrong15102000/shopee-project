import SkeletonBase from './SkeletonBase'

export default function ProductCardSkeleton() {
  return (
    <div
      className='min-h-[280px] overflow-hidden rounded-lg bg-white shadow-xs dark:bg-slate-800'
      role='status'
      aria-busy='true'
      aria-label='Đang tải sản phẩm'
    >
      {/* Image placeholder - aspect ratio 1:1 */}
      <div className='relative w-full pt-[100%]'>
        <SkeletonBase className='absolute top-0 left-0 h-full w-full rounded-tl-sm rounded-tr-sm' />
      </div>

      {/* Product info */}
      <div className='overflow-hidden p-2'>
        {/* Title - 2 lines */}
        <div className='min-h-[1.9rem]'>
          <SkeletonBase className='mb-1 h-3 w-full' />
          <SkeletonBase className='h-3 w-3/4' />
        </div>

        {/* Price */}
        <div className='mt-3 flex items-center gap-2'>
          <SkeletonBase className='h-4 w-16' />
          <SkeletonBase className='h-4 w-20' />
        </div>

        {/* Rating and sold */}
        <div className='mt-3 flex items-center justify-start gap-2'>
          <div className='flex gap-0.5'>
            {[...Array(5)].map((_, index) => (
              <SkeletonBase key={index} className='h-3 w-3' />
            ))}
          </div>
          <SkeletonBase className='h-3 w-16' />
        </div>
      </div>

      {/* Location */}
      <div className='p-2'>
        <SkeletonBase className='h-3 w-20' />
      </div>
    </div>
  )
}
