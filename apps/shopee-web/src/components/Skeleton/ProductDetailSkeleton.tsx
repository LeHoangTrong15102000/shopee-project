import SkeletonBase from './SkeletonBase'

export default function ProductDetailSkeleton() {
  return (
    <div
      className='min-h-[800px] bg-gray-200 py-6 dark:bg-slate-900'
      role='status'
      aria-busy='true'
      aria-label='Đang tải chi tiết sản phẩm'
    >
      <div className='container'>
        <div className='bg-white p-4 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50'>
          <div className='grid grid-cols-12 gap-2 lg:gap-9'>
            {/* Product images and slider */}
            <div className='col-span-12 md:col-span-5'>
              {/* Main image */}
              <div className='relative w-full pt-[100%]'>
                <SkeletonBase className='absolute top-0 left-0 h-full w-full' />
              </div>
              {/* Slider thumbnails */}
              <div className='relative mt-4 grid grid-cols-5 gap-1'>
                {[...Array(5)].map((_, index) => (
                  <div key={index} className='relative w-full pt-[100%]'>
                    <SkeletonBase className='absolute top-0 left-0 h-full w-full' />
                  </div>
                ))}
              </div>
            </div>

            {/* Product info */}
            <div className='col-span-12 md:col-span-7'>
              {/* Title */}
              <SkeletonBase className='mb-2 h-7 w-full' />
              <SkeletonBase className='mb-6 h-7 w-3/4' />

              {/* Rating, reviews, sold */}
              <div className='mt-6 flex items-center gap-4'>
                <SkeletonBase className='h-5 w-24' />
                <SkeletonBase className='h-5 w-20' />
                <SkeletonBase className='h-5 w-20' />
              </div>

              {/* Price section */}
              <div className='mt-3 bg-[#fafafa] p-4 dark:bg-slate-700/50'>
                <div className='flex items-center gap-3'>
                  <SkeletonBase className='h-5 w-24' />
                  <SkeletonBase className='h-8 w-32' />
                  <SkeletonBase className='h-6 w-16' />
                </div>
              </div>

              {/* Quantity */}
              <div className='mt-8 flex items-center gap-4'>
                <SkeletonBase className='h-5 w-16' />
                <SkeletonBase className='h-8 w-32' />
                <SkeletonBase className='h-5 w-24' />
              </div>

              {/* Buttons */}
              <div className='mt-10 flex items-center gap-4'>
                <SkeletonBase className='h-12 w-48' />
                <SkeletonBase className='h-12 w-28' />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product description */}
      <div className='mt-8'>
        <div className='container'>
          <div className='bg-white p-8 shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50'>
            <SkeletonBase className='mb-8 h-6 w-40' />
            <div className='space-y-3'>
              <SkeletonBase className='h-4 w-full' />
              <SkeletonBase className='h-4 w-full' />
              <SkeletonBase className='h-4 w-5/6' />
              <SkeletonBase className='h-4 w-full' />
              <SkeletonBase className='h-4 w-4/5' />
              <SkeletonBase className='h-4 w-full' />
              <SkeletonBase className='h-4 w-3/4' />
            </div>
          </div>
        </div>
      </div>

      {/* Related products */}
      <div className='mt-8'>
        <div className='container'>
          <SkeletonBase className='mb-6 h-5 w-48' />
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'>
            {[...Array(6)].map((_, index) => (
              <div key={index} className='col-span-1'>
                <div className='overflow-hidden rounded-xs bg-white shadow-sm dark:bg-slate-800 dark:shadow-slate-900/50'>
                  <div className='relative w-full pt-[100%]'>
                    <SkeletonBase className='absolute top-0 left-0 h-full w-full' />
                  </div>
                  <div className='p-2'>
                    <SkeletonBase className='mb-1 h-3 w-full' />
                    <SkeletonBase className='mb-3 h-3 w-3/4' />
                    <SkeletonBase className='h-4 w-20' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
