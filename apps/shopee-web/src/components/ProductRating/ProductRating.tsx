const ProductRating = ({
  rating,
  activeClassname = 'h-3 w-3 md:h-4 md:w-4 fill-orange text-orange dark:fill-orange-400 dark:text-orange-400',
  nonActiveClassname = 'h-3 w-3 md:h-4 md:w-4 fill-current text-gray-300 dark:text-slate-600'
}: {
  rating: number
  activeClassname?: string
  nonActiveClassname?: string
}) => {
  // order là truyền vào số thứ tự
  const handleWidthRating = (order: number) => {
    if (order <= rating) {
      return '100%'
    }
    if (order > rating && order - rating < 1) {
      // Fix floating point precision by rounding to 6 decimal places
      const percentage = (rating - Math.floor(rating)) * 100
      return Math.round(percentage * 1000000) / 1000000 + '%'
    }
    return '0%'
  }
  return (
    <div className='flex items-center' role='img' aria-label={`${rating} out of 5 stars`}>
      {/* thẻ cha chứa relative để 2 ngôi sao chồng chéo */}
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <div className='relative' key={index}>
            <div
              className='absolute top-0 left-0 h-full overflow-hidden'
              style={{ width: handleWidthRating(index + 1) }}
            >
              <svg viewBox='0 0 15 15' x={0} y={0} className={activeClassname}>
                <polygon
                  points='7.5 .8 9.7 5.4 14.5 5.9 10.7 9.1 11.8 14.2 7.5 11.6 3.2 14.2 4.3 9.1 .5 5.9 5.3 5.4'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeMiterlimit={10}
                />
              </svg>
            </div>
            <svg viewBox='0 0 15 15' x={0} y={0} className={nonActiveClassname}>
              <polygon
                points='7.5 .8 9.7 5.4 14.5 5.9 10.7 9.1 11.8 14.2 7.5 11.6 3.2 14.2 4.3 9.1 .5 5.9 5.3 5.4'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeMiterlimit={10}
              />
            </svg>
          </div>
        ))}
    </div>
  )
}

export default ProductRating
