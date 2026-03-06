import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import config from 'src/constant/config'
import { toast } from 'react-toastify'
import Button from 'src/components/Button'

interface AvatarCropModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (croppedFile: File) => void
  imageFile: File | null
}

const CROP_SIZE = 200
const MIN_SCALE = 1
const MAX_SCALE = 3

const AvatarCropModal = ({ isOpen, onClose, onConfirm, imageFile }: AvatarCropModalProps) => {
  const { t } = useTranslation('user')
  const { t: tCommon } = useTranslation('common')
  const reducedMotion = useReducedMotion()
  const [imageUrl, setImageUrl] = useState<string>('')
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isProcessing, setIsProcessing] = useState(false)

  const imageRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (imageFile) {
      if (imageFile.size > config.maxSizeUploadAvatar) {
        toast.error(t('avatar.maxSize'), { autoClose: 2000, position: 'top-center' })
        onClose()
        return
      }

      const validTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!validTypes.includes(imageFile.type)) {
        toast.error(t('avatar.invalidFormat'), {
          autoClose: 2000,
          position: 'top-center'
        })
        onClose()
        return
      }

      const url = URL.createObjectURL(imageFile)
      setImageUrl(url)
      setScale(1)
      setPosition({ x: 0, y: 0 })

      return () => URL.revokeObjectURL(url)
    }
  }, [imageFile, onClose])

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isProcessing) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, isProcessing, onClose])

  const handleImageLoad = () => {
    // Image loaded - ready for cropping
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return
      const newX = e.clientX - dragStart.x
      const newY = e.clientY - dragStart.y
      setPosition({ x: newX, y: newY })
    },
    [isDragging, dragStart]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y
    setPosition({ x: newX, y: newY })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value))
  }

  const handleConfirm = async () => {
    if (!imageRef.current || !canvasRef.current || !imageFile) return

    setIsProcessing(true)

    try {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = CROP_SIZE
      canvas.height = CROP_SIZE

      const img = imageRef.current
      const containerSize = 250
      const imgDisplayWidth = img.naturalWidth * scale * (containerSize / Math.max(img.naturalWidth, img.naturalHeight))
      const imgDisplayHeight =
        img.naturalHeight * scale * (containerSize / Math.max(img.naturalWidth, img.naturalHeight))

      const centerOffsetX = (containerSize - imgDisplayWidth) / 2
      const centerOffsetY = (containerSize - imgDisplayHeight) / 2

      const cropAreaLeft = (containerSize - CROP_SIZE) / 2
      const cropAreaTop = (containerSize - CROP_SIZE) / 2

      const imgLeftInContainer = centerOffsetX + position.x
      const imgTopInContainer = centerOffsetY + position.y

      const sourceX = ((cropAreaLeft - imgLeftInContainer) / imgDisplayWidth) * img.naturalWidth
      const sourceY = ((cropAreaTop - imgTopInContainer) / imgDisplayHeight) * img.naturalHeight
      const sourceWidth = (CROP_SIZE / imgDisplayWidth) * img.naturalWidth
      const sourceHeight = (CROP_SIZE / imgDisplayHeight) * img.naturalHeight

      ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, CROP_SIZE, CROP_SIZE)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = imageFile.name.replace(/\.[^/.]+$/, '') + '_cropped.jpg'
            const croppedFile = new File([blob], fileName, { type: 'image/jpeg' })
            onConfirm(croppedFile)
          }
          setIsProcessing(false)
        },
        'image/jpeg',
        0.9
      )
    } catch (error) {
      toast.error(t('avatar.processingError'), { autoClose: 2000, position: 'top-center' })
      setIsProcessing(false)
    }
  }

  const animationProps = reducedMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2 }
      }

  const backdropAnimationProps = reducedMotion
    ? { initial: false }
    : {
        initial: { opacity: 0 },
        animate: { opacity: 0.5 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 }
      }

  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <>
          <motion.div
            {...backdropAnimationProps}
            className='fixed inset-0 z-50 bg-black backdrop-blur-xs'
            onClick={!isProcessing ? onClose : undefined}
            aria-hidden='true'
          />

          <div className='pointer-events-none fixed inset-0 z-51 flex items-center justify-center p-4'>
            <motion.div
              {...animationProps}
              role='dialog'
              aria-modal='true'
              aria-labelledby='avatar-crop-title'
              className='pointer-events-auto w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-slate-800'
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                id='avatar-crop-title'
                className='mb-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100'
              >
                {t('avatar.editTitle')}
              </h2>

              <div className='flex flex-col items-center gap-4'>
                {/* Crop Area */}
                <div
                  ref={containerRef}
                  className='relative h-[min(250px,80vw)] w-[min(250px,80vw)] overflow-hidden rounded-lg bg-gray-100 dark:bg-slate-700'
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                  <img
                    ref={imageRef}
                    src={imageUrl}
                    alt='Preview'
                    onLoad={handleImageLoad}
                    className='pointer-events-none absolute top-1/2 left-1/2 max-h-none max-w-none select-none'
                    style={{
                      transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${scale})`,
                      transformOrigin: 'center center'
                    }}
                    draggable={false}
                  />
                  {/* Circular crop overlay */}
                  <div className='pointer-events-none absolute inset-0'>
                    <svg width='250' height='250' className='absolute inset-0'>
                      <defs>
                        <mask id='cropMask'>
                          <rect width='250' height='250' fill='white' />
                          <circle cx='125' cy='125' r='100' fill='black' />
                        </mask>
                      </defs>
                      <rect width='250' height='250' fill='rgba(0,0,0,0.5)' mask='url(#cropMask)' />
                      <circle cx='125' cy='125' r='100' fill='none' stroke='white' strokeWidth='2' />
                    </svg>
                  </div>
                </div>

                {/* Zoom Control */}
                <div className='flex w-full items-center gap-3 px-2'>
                  <svg
                    className='h-4 w-4 text-gray-500 dark:text-gray-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7'
                    />
                  </svg>
                  <input
                    type='range'
                    min={MIN_SCALE}
                    max={MAX_SCALE}
                    step={0.1}
                    value={scale}
                    onChange={handleScaleChange}
                    className='h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#ee4d2d] dark:bg-slate-600'
                  />
                  <svg
                    className='h-5 w-5 text-gray-500 dark:text-gray-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7'
                    />
                  </svg>
                </div>

                {/* Preview */}
                <div className='flex items-center gap-3'>
                  <span className='text-sm text-gray-500 dark:text-gray-400'>{t('avatar.preview')}</span>
                  <div className='h-16 w-16 overflow-hidden rounded-full border-2 border-gray-200 dark:border-slate-600'>
                    <div
                      className='relative h-full w-full'
                      style={{
                        backgroundImage: `url(${imageUrl})`,
                        backgroundSize: `${scale * 100}%`,
                        backgroundPosition: `calc(50% + ${position.x * 0.32}px) calc(50% + ${position.y * 0.32}px)`
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className='mt-2 flex w-full gap-3'>
                  <Button
                    variant='secondary'
                    type='button'
                    disabled={isProcessing}
                    onClick={onClose}
                    className='flex-1 rounded-md px-4 py-2.5 font-medium'
                  >
                    {tCommon('button.cancel')}
                  </Button>
                  <Button
                    variant='primary'
                    type='button'
                    disabled={isProcessing}
                    isLoading={isProcessing}
                    onClick={handleConfirm}
                    className='flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 font-medium'
                  >
                    {tCommon('button.confirm')}
                  </Button>
                </div>
              </div>

              {/* Hidden canvas for cropping */}
              <canvas ref={canvasRef} className='hidden' />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AvatarCropModal
