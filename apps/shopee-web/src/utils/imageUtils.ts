/**
 * Image utility functions for the Shopee Clone project
 */

export const FALLBACK_IMAGES = {
  product:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMTAwIDYwTDEzMCAxMDBIMTEwVjE0MEg5MFYxMDBINzBMMTAwIDYwWiIgZmlsbD0iI0QxRDVEQiIvPjwvc3ZnPg==',
  avatar:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSIxMDAiIGZpbGw9IiNFNUU3RUIiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSI4MCIgcj0iMzAiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNMTAwIDE0MEMxMzMuMTM3IDE0MCAxNjAgMTUzLjQzMSAxNjAgMTcwVjIwMEg0MFYxNzBDNDAgMTUzLjQzMSA2Ni44NjI5IDE0MCAxMDAgMTQwWiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==',
  banner:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDgwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGM0Y0RjYiLz48L3N2Zz4=',
  placeholder:
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNFNUU3RUIiLz48L3N2Zz4='
} as const

/**
 * Check if a URL is valid
 */
export const isValidImageUrl = (url: string | undefined | null): boolean => {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')
  }
}

/**
 * Get image URL with fallback
 */
export const getImageUrl = (
  url: string | undefined | null,
  fallback: keyof typeof FALLBACK_IMAGES = 'placeholder'
): string => {
  if (isValidImageUrl(url)) {
    return url as string
  }
  return FALLBACK_IMAGES[fallback]
}

/**
 * Preload an image
 */
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Preload multiple images
 */
export const preloadImages = (srcs: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(srcs.map(preloadImage))
}

/**
 * Check if image exists (can be loaded)
 */
export const checkImageExists = async (src: string): Promise<boolean> => {
  try {
    await preloadImage(src)
    return true
  } catch {
    return false
  }
}

/**
 * Get optimized image URL (for future CDN integration)
 * This can be extended to support image CDN like Cloudinary, imgix, etc.
 */
export const getOptimizedImageUrl = (
  src: string,
  _options?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png' | 'auto'
  }
): string => {
  // For now, just return the original URL
  // In the future, this can be extended to support image CDN transformations
  return src
}

/**
 * Generate srcSet for responsive images
 */
export const generateSrcSet = (_src: string, _widths: number[] = [320, 640, 768, 1024, 1280]): string => {
  // For now, return empty string as we don't have image CDN
  // In the future, this can generate proper srcSet
  return ''
}

/**
 * Calculate aspect ratio padding percentage
 */
export const getAspectRatioPadding = (width: number, height: number): string => {
  return `${(height / width) * 100}%`
}

/**
 * Image loading states
 */
export type ImageLoadingState = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * Create a blur data URL placeholder (simple gray)
 */
export const createBlurPlaceholder = (width: number = 10, height: number = 10, color: string = '#E5E7EB'): string => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/></svg>`
  return `data:image/svg+xml;base64,${btoa(svg)}`
}
