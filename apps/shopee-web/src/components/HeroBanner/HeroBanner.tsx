import { useState, useEffect } from 'react'
import Button from 'src/components/Button'
import BannerSlide from './BannerSlide'
import BannerIndicators from './BannerIndicators'
import { BannerSlide as BannerSlideType } from './types'

// Mock data cho banner slides
const bannerSlides: BannerSlideType[] = [
  {
    id: 1,
    image: 'https://cf.shopee.vn/file/sg-11134004-7rd4c-ltqjlvx9b0co38_xxhdpi',
    title: 'Mega Sale 12.12',
    subtitle: 'Giảm đến 50% tất cả sản phẩm',
    link: '/products?promotion=mega-sale',
    backgroundColor: '#ee4d2d'
  },
  {
    id: 2,
    image: 'https://cf.shopee.vn/file/sg-11134004-7rd4c-ltqjlvx9ecx488_xxhdpi',
    title: 'Flash Sale Hàng Ngày',
    subtitle: 'Săn deal 1k cho sản phẩm yêu thích',
    link: '/flash-sale',
    backgroundColor: '#f53d2d'
  },
  {
    id: 3,
    image: 'https://cf.shopee.vn/file/sg-11134004-7rd4c-ltqjlvx9grib0c_xxhdpi',
    title: 'Freeship Xtra',
    subtitle: 'Miễn phí vận chuyển toàn quốc',
    link: '/shipping-promotion',
    backgroundColor: '#ff6b35'
  },
  {
    id: 4,
    image: 'https://cf.shopee.vn/file/sg-11134004-7rd4c-ltqjlvx9ht5s0s_xxhdpi',
    title: 'Shopee Mall',
    subtitle: 'Thương hiệu chính hãng giá tốt',
    link: '/shopee-mall',
    backgroundColor: '#d73527'
  }
]

const HeroBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(true)

  // Auto play banner
  useEffect(() => {
    if (!isAutoPlay) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
    }, 5000) // Chuyển slide sau 5 giây

    return () => clearInterval(interval)
  }, [isAutoPlay])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const goToPrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)
  }

  const goToNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
  }

  const handleMouseEnter = () => {
    setIsAutoPlay(false)
  }

  const handleMouseLeave = () => {
    setIsAutoPlay(true)
  }

  return (
    <div
      className='relative h-[280px] w-full overflow-hidden rounded-lg shadow-lg md:h-[320px]'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Banner Slides */}
      <div
        className='flex h-full transition-transform duration-500 ease-in-out'
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {bannerSlides.map((slide, index) => (
          <BannerSlide key={slide.id} slide={slide} isActive={index === currentSlide} />
        ))}
      </div>

      {/* Navigation Arrows */}
      <Button
        animated={false}
        onClick={goToPrevSlide}
        className='absolute top-1/2 left-4 z-10 flex h-10 w-10 -translate-y-1/2 transform items-center justify-center rounded-full bg-white/80 shadow-md transition-all duration-200 hover:bg-white'
        aria-label='Previous slide'
      >
        <svg className='h-5 w-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
        </svg>
      </Button>

      <Button
        animated={false}
        onClick={goToNextSlide}
        className='absolute top-1/2 right-4 z-10 flex h-10 w-10 -translate-y-1/2 transform items-center justify-center rounded-full bg-white/80 shadow-md transition-all duration-200 hover:bg-white'
        aria-label='Next slide'
      >
        <svg className='h-5 w-5 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
        </svg>
      </Button>

      {/* Slide Indicators */}
      <BannerIndicators slides={bannerSlides} currentSlide={currentSlide} onSlideChange={goToSlide} />
    </div>
  )
}

export default HeroBanner
