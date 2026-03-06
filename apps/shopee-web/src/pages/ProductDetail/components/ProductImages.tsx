import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ImageWithFallback from 'src/components/ImageWithFallback'
import { Product as ProductType } from 'src/types/product.type'
import { imageCrossfade, staggerContainer, staggerItem, STAGGER_DELAY } from 'src/styles/animations'
import Button from 'src/components/Button'

const FALLBACK_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDcwQzg4LjUgNzAgNzkgNzkuNSA3OSA5MUM3OSAxMDIuNSA4OC41IDExMiAxMDAgMTEyQzExMS41IDExMiAxMjEgMTAyLjUgMTIxIDkxQzEyMSA3OS41IDExMS41IDcwIDEwMCA3MFpNMTAwIDEwNEM5Mi44IDEwNCA4NyA5OC4yIDg3IDkxQzg3IDgzLjggOTIuOCA3OCAxMDAgNzhDMTA3LjIgNzggMTEzIDgzLjggMTEzIDkxQzExMyA5OC4yIDEwNy4yIDEwNCAxMDAgMTA0WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNDAgMTMwSDYwQzU1LjYgMTMwIDUyIDEyNi40IDUyIDEyMlY3OEM1MiA3My42IDU1LjYgNzAgNjAgNzBIMTQwQzE0NC40IDcwIDE0OCA3My42IDE0OCA3OFYxMjJDMTQ4IDEyNi40IDE0NC40IDEzMCAxNDAgMTMwWk02MCA3OFYxMjJIMTQwVjc4SDYwWiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg=='

interface ProductImagesProps {
  product: ProductType
  reducedMotion: boolean
}

const ProductImages = ({ product, reducedMotion }: ProductImagesProps) => {
  const imageRef = useRef<HTMLImageElement>(null)
  const [currentIndexImages, setCurrentIndexImages] = useState([0, 5])
  const [activeImage, setActiveImage] = useState('')
  const [mainImageError, setMainImageError] = useState(false)

  const currentImages = useMemo(
    () => (product ? product.images.slice(...currentIndexImages) : []),
    [product, currentIndexImages]
  )

  useEffect(() => {
    if (product && product.images.length > 0) {
      setActiveImage(product.images[0])
    }
  }, [product])

  useEffect(() => {
    setMainImageError(false)
  }, [activeImage])

  const hoverActiveImage = (img: string) => {
    setActiveImage(img)
  }

  const handleNextSlider = () => {
    if (currentIndexImages[1] < product.images.length) {
      setCurrentIndexImages((prev) => [prev[0] + 1, prev[1] + 1])
    }
  }

  const handlePrevSlider = () => {
    if (currentIndexImages[0] > 0) {
      setCurrentIndexImages((prev) => [prev[0] - 1, prev[1] - 1])
    }
  }

  const handleGalleryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      handlePrevSlider()
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      handleNextSlider()
    }
  }

  const handleZoom = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const image = imageRef.current as HTMLImageElement
    const { naturalHeight, naturalWidth } = image

    const offsetX = event.pageX - (rect.x + window.scrollX)
    const offsetY = event.pageY - (rect.y + window.scrollY)

    const top = offsetY * (1 - naturalHeight / rect.height)
    const left = offsetX * (1 - naturalWidth / rect.width)

    image.style.width = naturalWidth + 'px'
    image.style.height = naturalHeight + 'px'
    image.style.maxWidth = 'unset'
    image.style.top = top + 'px'
    image.style.left = left + 'px'
  }

  const handleRemoveZoom = () => {
    imageRef.current?.removeAttribute('style')
  }

  return (
    <div className='col-span-12 md:col-span-5'>
      {/* Main Image with Zoom */}
      <div
        aria-hidden='true'
        className='relative w-full cursor-zoom-in overflow-hidden pt-[100%]'
        onMouseMove={handleZoom}
        onMouseLeave={handleRemoveZoom}
      >
        <AnimatePresence mode='wait'>
          <motion.img
            key={activeImage}
            src={mainImageError ? FALLBACK_IMAGE : activeImage}
            alt={product?.name}
            className='pointer-events-none absolute top-0 left-0 h-full w-full cursor-pointer bg-white object-cover dark:bg-slate-700'
            ref={imageRef}
            onError={() => setMainImageError(true)}
            variants={reducedMotion ? undefined : imageCrossfade}
            initial={reducedMotion ? undefined : 'hidden'}
            animate={reducedMotion ? undefined : 'visible'}
            exit={reducedMotion ? undefined : 'exit'}
          />
        </AnimatePresence>
      </div>
      {/* Image Slider */}
      <motion.div
        className='relative mt-4 grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-5'
        variants={reducedMotion ? undefined : staggerContainer(STAGGER_DELAY.fast)}
        initial={reducedMotion ? undefined : 'hidden'}
        animate={reducedMotion ? undefined : 'visible'}
        tabIndex={0}
        onKeyDown={handleGalleryKeyDown}
        role='group'
        aria-label='Product image gallery. Use left and right arrow keys to navigate.'
      >
        <Button
          animated={false}
          onClick={handlePrevSlider}
          className='absolute top-1/2 left-0 z-10 h-9 w-5 -translate-y-1/2 bg-black/20 text-white'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 19.5L8.25 12l7.5-7.5' />
          </svg>
        </Button>
        {currentImages.map((img, index) => {
          const isActive = img === activeImage
          return (
            <motion.div
              className='relative w-full pt-[100%]'
              key={index}
              role='button'
              tabIndex={0}
              aria-hidden='true'
              onMouseEnter={() => hoverActiveImage(img)}
              variants={reducedMotion ? undefined : staggerItem}
              whileHover={reducedMotion ? undefined : { scale: 1.05 }}
              transition={{ duration: 0.15 }}
            >
              <ImageWithFallback
                src={img}
                alt='anhSlider'
                className='absolute top-0 left-0 h-full w-full cursor-pointer bg-white object-cover dark:bg-slate-700'
              />
              {isActive && <div className='absolute inset-0 border-2 border-orange'></div>}
            </motion.div>
          )
        })}
        <Button
          animated={false}
          onClick={handleNextSlider}
          className='absolute top-1/2 right-0 z-10 h-9 w-5 -translate-y-1/2 bg-black/20 text-white'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-5 w-5'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M8.25 4.5l7.5 7.5-7.5 7.5' />
          </svg>
        </Button>
      </motion.div>
    </div>
  )
}

export default ProductImages
