import { useState, useCallback } from 'react'

const STORAGE_KEY = 'shopee_view_mode'

export type ViewMode = 'grid' | 'list'

export const useViewMode = () => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'grid'
    const saved = localStorage.getItem(STORAGE_KEY)
    return (saved === 'list' ? 'list' : 'grid') as ViewMode
  })

  const changeViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [])

  return { viewMode, changeViewMode }
}

export default useViewMode
