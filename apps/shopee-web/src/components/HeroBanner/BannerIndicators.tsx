import Button from 'src/components/Button'
import type { BannerSlide } from './types'

interface Props {
  slides: BannerSlide[]
  currentSlide: number
  onSlideChange: (index: number) => void
}

const BannerIndicators = ({ slides, currentSlide, onSlideChange }: Props) => {
  return (
    <div className='absolute bottom-2 left-1/2 z-20 -translate-x-1/2 transform sm:bottom-4'>
      <div className='flex items-center space-x-1.5 sm:space-x-2'>
        {slides.map((_, index) => (
          <Button
            animated={false}
            key={index}
            onClick={() => onSlideChange(index)}
            className={`rounded-full p-1 transition-all duration-300 ${
              index === currentSlide
                ? 'h-2.5 w-6 bg-white shadow-lg sm:h-3 sm:w-8'
                : 'h-2.5 w-2.5 bg-white/60 hover:bg-white/80 sm:h-3 sm:w-3'
            }`}
            aria-label={`Chuyển đến slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default BannerIndicators
