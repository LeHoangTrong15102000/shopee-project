import { useState, useCallback, useEffect, ImgHTMLAttributes } from 'react'
import classNames from 'classnames'

const DEFAULT_FALLBACK =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNMTAwIDcwQzg4LjUgNzAgNzkgNzkuNSA3OSA5MUM3OSAxMDIuNSA4OC41IDExMiAxMDAgMTEyQzExMS41IDExMiAxMjEgMTAyLjUgMTIxIDkxQzEyMSA3OS41IDExMS41IDcwIDEwMCA3MFpNMTAwIDEwNEM5Mi44IDEwNCA4NyA5OC4yIDg3IDkxQzg3IDgzLjggOTIuOCA3OCAxMDAgNzhDMTA3LjIgNzggMTEzIDgzLjggMTEzIDkxQzExMyA5OC4yIDEwNy4yIDEwNCAxMDAgMTA0WiIgZmlsbD0iIzlDQTNBRiIvPjxwYXRoIGQ9Ik0xNDAgMTMwSDYwQzU1LjYgMTMwIDUyIDEyNi40IDUyIDEyMlY3OEM1MiA3My42IDU1LjYgNzAgNjAgNzBIMTQwQzE0NC40IDcwIDE0OCA3My42IDE0OCA3OFYxMjJDMTQ4IDEyNi40IDE0NC40IDEzMCAxNDAgMTMwWk02MCA3OFYxMjJIMTQwVjc4SDYwWiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg=='

export interface ImageWithFallbackProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  fallbackSrc?: string
  onLoadError?: (error: Error) => void
}

export default function ImageWithFallback({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  className,
  onLoadError,
  ...props
}: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setCurrentSrc(src)
    setHasError(false)
  }, [src])

  const handleError = useCallback(() => {
    if (!hasError && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc)
      setHasError(true)
      onLoadError?.(new Error(`Failed to load image: ${src}`))
    }
  }, [hasError, currentSrc, fallbackSrc, src, onLoadError])

  return (
    <img src={currentSrc || fallbackSrc} alt={alt} onError={handleError} className={classNames(className)} {...props} />
  )
}
