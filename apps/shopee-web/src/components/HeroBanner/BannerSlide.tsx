import { Link } from 'react-router'
import Button from 'src/components/Button'
import type { BannerSlide as BannerSlideType } from './types'

interface Props {
  slide: BannerSlideType
  isActive: boolean
}

const BannerSlide = ({ slide, isActive }: Props) => {
  return (
    <Link
      to={slide.link}
      className={`relative block h-full w-full shrink-0 transition-all duration-500 ${
        isActive ? 'opacity-100' : 'opacity-90'
      }`}
      style={{ backgroundColor: slide.backgroundColor }}
    >
      {/* Background Image */}
      <div
        className='absolute inset-0 bg-cover bg-center bg-no-repeat'
        style={{
          backgroundImage: `url(${slide.image})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover'
        }}
      >
        {/* Gradient Overlay */}
        <div className='absolute inset-0 bg-linear-to-r from-black/30 to-transparent'></div>
      </div>

      {/* Content */}
      <div className='relative z-10 flex h-full items-center px-8 md:px-12'>
        <div className='max-w-md text-white'>
          <h2 className='mb-2 text-2xl leading-tight font-bold drop-shadow-lg md:text-3xl'>{slide.title}</h2>
          <p className='mb-4 text-sm leading-relaxed opacity-90 drop-shadow-md md:text-base'>{slide.subtitle}</p>
          <Button
            animated={false}
            className='inline-flex transform items-center rounded-full bg-white px-6 py-2 font-medium text-gray-900 shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gray-100'
          >
            <span>Mua ngay</span>
            <svg className='ml-2 h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </Button>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className='absolute top-4 right-4 h-16 w-16 rounded-full bg-white/10 blur-xs'></div>
      <div className='absolute right-8 bottom-8 h-24 w-24 rounded-full bg-white/5 blur-md'></div>
    </Link>
  )
}

export default BannerSlide
