import SkeletonBase from './SkeletonBase'

export default function AsideFilterSkeleton() {
  return (
    <div className='min-h-[500px] py-4' role='status' aria-busy='true' aria-label='Đang tải bộ lọc'>
      {/* Categories title skeleton */}
      <div className='flex items-center'>
        <SkeletonBase className='mr-2 h-4 w-3' />
        <SkeletonBase className='h-5 w-32' />
      </div>
      <div className='my-4 h-px bg-gray-300 dark:bg-slate-600'></div>

      {/* Categories list skeleton */}
      <ul>
        {Array(7)
          .fill(0)
          .map((_, index) => (
            <li className='py-1.5 pl-2 md:py-2' key={index}>
              <SkeletonBase className='h-4 w-24' />
            </li>
          ))}
      </ul>

      {/* Filter title skeleton */}
      <div className='mt-4 flex items-center'>
        <SkeletonBase className='mr-3 h-4 w-3' />
        <SkeletonBase className='h-5 w-28' />
      </div>
      <div className='my-4 h-px bg-gray-300 dark:bg-slate-600'></div>

      {/* Price range skeleton */}
      <div className='my-4'>
        <SkeletonBase className='mb-2 h-4 w-20' />
        <div className='mt-2'>
          <div className='flex items-start'>
            <SkeletonBase className='h-9 w-full rounded-xs md:h-8' />
            <div className='mx-2.5 shrink-0 text-[#bdbdbd] dark:text-slate-500'>--</div>
            <SkeletonBase className='h-9 w-full rounded-xs md:h-8' />
          </div>
          <div className='mt-1 min-h-5'></div>
          <SkeletonBase className='h-10 w-full rounded-xs md:h-9' />
          <div className='my-4 h-px bg-gray-300 dark:bg-slate-600'></div>
        </div>

        {/* Rating title skeleton */}
        <div className='my-4'>
          <SkeletonBase className='h-4 w-16' />
        </div>
      </div>

      {/* Rating stars skeleton */}
      <div className='space-y-3'>
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <div key={index} className='flex items-center'>
              <div className='flex gap-1'>
                {Array(5)
                  .fill(0)
                  .map((_, starIndex) => (
                    <SkeletonBase key={starIndex} className='h-4 w-4' />
                  ))}
              </div>
              {index < 4 && <SkeletonBase className='ml-2 h-4 w-12' />}
            </div>
          ))}
      </div>

      {/* Button skeleton */}
      <div className='my-4 h-px bg-gray-300 dark:bg-slate-600'></div>
      <SkeletonBase className='h-9 w-full rounded-xs' />
    </div>
  )
}
