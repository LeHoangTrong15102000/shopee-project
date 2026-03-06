import { useState, useCallback, useRef, useEffect } from 'react'
import classNames from 'classnames'

const DEFAULT_FALLBACK =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDcwQzg4LjUgNzAgNzkgNzkuNSA3OSA5MUM3OSAxMDIuNSA4OC41IDExMiAxMDAgMTEyQzExMS41IDExMiAxMjEgMTAyLjUgMTIxIDkxQzEyMSA3OS41IDExMS41IDcwIDEwMCA3MFpNMTAwIDEwNEM5Mi44IDEwNCA4NyA5OC4yIDg3IDkxQzg3IDgzLjggOTIuOCA3OCAxMDAgNzhDMTA3LjIgNzggMTEzIDgzLjggMTEzIDkxQzExMyA5OC4yIDEwNy4yIDEwNCAxMDAgMTA0WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNDAgMTMwSDYwQzU1LjYgMTMwIDUyIDEyNi40IDUyIDEyMlY3OEM1MiA3My42IDU1LjYgNzAgNjAgNzBIMTQwQzE0NC40IDcwIDE0OCA3My42IDE0OCA3OFYxMjJDMTQ4IDEyNi40IDE0NC40IDEzMCAxNDAgMTMwWk02MCA3OFYxMjJIMTQwVjc4SDYwWiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg=='

export interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  containerClassName?: string
  fallbackSrc?: string
  aspectRatio?: '1:1' | '16:9' | '4:3' | '3:2' | 'auto'
  loading?: 'lazy' | 'eager'
  showSkeleton?: boolean
  objectFit?: 'cover' | 'contain' | 'fill' | 'none'
  blurPlaceholder?: boolean
  onLoad?: () => void
  onError?: () => void
  width?: number | string
  height?: number | string
  sizes?: string
  srcSet?: string
}

type ImageState = 'loading' | 'loaded' | 'error'

const ASPECT_RATIO_CLASSES: Record<string, string> = {
  '1:1': 'pt-[100%]',
  '16:9': 'pt-[56.25%]',
  '4:3': 'pt-[75%]',
  '3:2': 'pt-[66.67%]',
  auto: ''
}

const OBJECT_FIT_CLASSES: Record<string, string> = {
  cover: 'object-cover',
  contain: 'object-contain',
  fill: 'object-fill',
  none: 'object-none'
}

export default function OptimizedImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  fallbackSrc = DEFAULT_FALLBACK,
  aspectRatio = 'auto',
  loading = 'lazy',
  showSkeleton = true,
  objectFit = 'cover',
  blurPlaceholder = true,
  onLoad,
  onError,
  width,
  height,
  sizes,
  srcSet
}: OptimizedImageProps) {
  const [imageState, setImageState] = useState<ImageState>('loading')
  const [currentSrc, setCurrentSrc] = useState(src)
  const hasTriedFallback = useRef(false)

  useEffect(() => {
    hasTriedFallback.current = false
    setCurrentSrc(src)

    // Check if image is already cached/loaded in browser
    if (src) {
      const img = new Image()
      img.src = src
      if (img.complete && img.naturalWidth > 0) {
        // Image is already cached, skip loading state
        setImageState('loaded')
        return
      }
    }

    setImageState('loading')
  }, [src])

  const handleLoad = useCallback(() => {
    setImageState('loaded')
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    if (!hasTriedFallback.current && currentSrc !== fallbackSrc) {
      hasTriedFallback.current = true
      setCurrentSrc(fallbackSrc)
    } else {
      setImageState('error')
      onError?.()
    }
  }, [currentSrc, fallbackSrc, onError])

  const isLoading = imageState === 'loading'
  const isLoaded = imageState === 'loaded'

  const imageClasses = classNames(OBJECT_FIT_CLASSES[objectFit], 'transition-opacity duration-300', {
    'opacity-0': isLoading && blurPlaceholder,
    'opacity-100': isLoaded || !blurPlaceholder
  })

  const renderSkeleton = () =>
    showSkeleton && isLoading ? (
      <div className='absolute inset-0 animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700' aria-hidden='true' />
    ) : null

  const renderImage = (additionalClasses = '') => (
    <img
      src={currentSrc}
      alt={alt}
      loading={loading}
      onLoad={handleLoad}
      onError={handleError}
      width={width}
      height={height}
      sizes={sizes}
      srcSet={srcSet}
      className={classNames(imageClasses, additionalClasses, className)}
    />
  )

  if (aspectRatio === 'auto') {
    return (
      <div className={classNames('relative inline-block', containerClassName)}>
        {renderSkeleton()}
        {renderImage()}
      </div>
    )
  }

  return (
    <div
      className={classNames('relative w-full overflow-hidden', ASPECT_RATIO_CLASSES[aspectRatio], containerClassName)}
    >
      {renderSkeleton()}
      {renderImage('absolute top-0 left-0 h-full w-full')}
    </div>
  )
}
