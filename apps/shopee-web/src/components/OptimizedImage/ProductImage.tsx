import OptimizedImage, { OptimizedImageProps } from './OptimizedImage'
import classNames from 'classnames'

const PRODUCT_FALLBACK =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGRkZGRkYiLz48cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSIxMjAiIGhlaWdodD0iMTIwIiByeD0iOCIgZmlsbD0iI0Y1RjVGNSIgc3Ryb2tlPSIjRTVFN0VCIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNODUgNzBMNzAgMTAwSDEzMEwxMTUgNzBMOTUgOTBMODUgNzBaIiBmaWxsPSIjRDFENURCIi8+PGNpcmNsZSBjeD0iMTIwIiBjeT0iNzAiIHI9IjEwIiBmaWxsPSIjRDFENURCIi8+PHBhdGggZD0iTTcwIDEwMEgxMzBWMTMwQzEzMCAxMzUuNTIzIDEyNS41MjMgMTQwIDEyMCAxNDBIODBDNzQuNDc3MiAxNDAgNzAgMTM1LjUyMyA3MCAxMzBWMTAwWiIgZmlsbD0iI0U1RTdFQiIvPjwvc3ZnPg=='

interface ProductImageProps extends Omit<OptimizedImageProps, 'aspectRatio' | 'objectFit'> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-full'
}

export default function ProductImage({
  src,
  alt,
  size = 'xl',
  className = '',
  containerClassName = '',
  fallbackSrc = PRODUCT_FALLBACK,
  ...props
}: ProductImageProps) {
  const sizeClass = size !== 'xl' ? SIZE_CLASSES[size] : ''

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      aspectRatio='1:1'
      objectFit='cover'
      fallbackSrc={fallbackSrc}
      className={classNames('bg-white dark:bg-slate-700', className)}
      containerClassName={classNames(sizeClass, containerClassName)}
      {...props}
    />
  )
}
