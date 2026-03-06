import ProductCardSkeleton from './ProductCardSkeleton'

interface ProductListSkeletonProps {
  count?: number
}

export default function ProductListSkeleton({ count = 20 }: ProductListSkeletonProps) {
  return (
    <div
      className='mt-6 grid min-h-[600px] grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
      role='status'
      aria-busy='true'
      aria-label='Đang tải danh sách sản phẩm'
    >
      {[...Array(count)].map((_, index) => (
        <div className='col-span-1' key={index}>
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  )
}
