import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'
import { useNavigate } from 'react-router'
import useKeyboardShortcuts, { Shortcut, SequenceShortcut } from 'src/hooks/useKeyboardShortcuts'
import KeyboardShortcutsModal from 'src/components/KeyboardShortcutsModal'
import path from 'src/constant/path'

// Extended shortcut type for display purposes (includes sequence shortcuts)
export interface DisplayShortcut {
  key: string
  keys?: string[] // For sequence shortcuts display
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  description: string
  category: string
}

interface KeyboardShortcutsContextValue {
  shortcuts: Shortcut[]
  displayShortcuts: DisplayShortcut[]
  isHelpModalOpen: boolean
  toggleHelpModal: () => void
  openHelpModal: () => void
  closeHelpModal: () => void
  registerShortcut: (shortcut: Shortcut) => void
  unregisterShortcut: (key: string, ctrlKey?: boolean, metaKey?: boolean) => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextValue | null>(null)

export const useKeyboardShortcutsContext = () => {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    throw new Error('useKeyboardShortcutsContext must be used within KeyboardShortcutsProvider')
  }
  return context
}

interface KeyboardShortcutsProviderProps {
  children: ReactNode
}

const SEARCH_INPUT_ID = 'main-search-input'

export const KeyboardShortcutsProvider = ({ children }: KeyboardShortcutsProviderProps) => {
  const navigate = useNavigate()
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const [customShortcuts, setCustomShortcuts] = useState<Shortcut[]>([])

  const toggleHelpModal = useCallback(() => {
    setIsHelpModalOpen((prev) => !prev)
  }, [])

  const openHelpModal = useCallback(() => {
    setIsHelpModalOpen(true)
  }, [])

  const closeHelpModal = useCallback(() => {
    setIsHelpModalOpen(false)
  }, [])

  const focusSearch = useCallback(() => {
    const searchInput = document.getElementById(SEARCH_INPUT_ID) as HTMLInputElement | null
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    }
  }, [])

  const navigateHome = useCallback(() => {
    navigate(path.home)
  }, [navigate])

  const navigateCart = useCallback(() => {
    navigate(path.cart)
  }, [navigate])

  const navigateProfile = useCallback(() => {
    navigate(path.profile)
  }, [navigate])

  const navigateOrders = useCallback(() => {
    navigate(path.historyPurchases)
  }, [navigate])

  const closeActiveModal = useCallback(() => {
    if (isHelpModalOpen) {
      closeHelpModal()
      return
    }

    const activeElement = document.activeElement as HTMLElement
    if (activeElement && activeElement.tagName !== 'BODY') {
      activeElement.blur()
    }
  }, [isHelpModalOpen, closeHelpModal])

  // Single-key shortcuts
  const defaultShortcuts: Shortcut[] = useMemo(
    () => [
      { key: '/', description: 'Tìm kiếm', action: focusSearch, category: 'Chung' },
      { key: 'k', ctrlKey: true, description: 'Tìm kiếm', action: focusSearch, category: 'Chung' },
      { key: '?', description: 'Hiện phím tắt', action: toggleHelpModal, category: 'Chung' },
      { key: 'Escape', description: 'Đóng modal/dialog', action: closeActiveModal, category: 'Chung' }
    ],
    [focusSearch, toggleHelpModal, closeActiveModal]
  )

  // Sequence shortcuts (g then X)
  const sequenceShortcuts: SequenceShortcut[] = useMemo(
    () => [
      { sequence: ['g', 'h'], description: 'Trang chủ', action: navigateHome, category: 'Điều hướng' },
      { sequence: ['g', 'p'], description: 'Trang cá nhân', action: navigateProfile, category: 'Điều hướng' },
      { sequence: ['g', 'c'], description: 'Giỏ hàng', action: navigateCart, category: 'Điều hướng' },
      { sequence: ['g', 'o'], description: 'Đơn hàng', action: navigateOrders, category: 'Điều hướng' }
    ],
    [navigateHome, navigateProfile, navigateCart, navigateOrders]
  )

  const allShortcuts = useMemo(() => [...defaultShortcuts, ...customShortcuts], [defaultShortcuts, customShortcuts])

  // Create display shortcuts for the modal (combines single-key and sequence shortcuts)
  const displayShortcuts: DisplayShortcut[] = useMemo(() => {
    const singleKeyDisplay: DisplayShortcut[] = allShortcuts.map((s) => ({
      key: s.key,
      ctrlKey: s.ctrlKey,
      metaKey: s.metaKey,
      shiftKey: s.shiftKey,
      description: s.description,
      category: s.category
    }))

    const sequenceDisplay: DisplayShortcut[] = sequenceShortcuts.map((s) => ({
      key: s.sequence.join(' → '),
      keys: s.sequence,
      description: s.description,
      category: s.category
    }))

    return [...singleKeyDisplay, ...sequenceDisplay]
  }, [allShortcuts, sequenceShortcuts])

  const registerShortcut = useCallback((shortcut: Shortcut) => {
    setCustomShortcuts((prev) => {
      const exists = prev.some(
        (s) => s.key === shortcut.key && s.ctrlKey === shortcut.ctrlKey && s.metaKey === shortcut.metaKey
      )
      if (exists) return prev
      return [...prev, shortcut]
    })
  }, [])

  const unregisterShortcut = useCallback((key: string, ctrlKey?: boolean, metaKey?: boolean) => {
    setCustomShortcuts((prev) => prev.filter((s) => !(s.key === key && s.ctrlKey === ctrlKey && s.metaKey === metaKey)))
  }, [])

  useKeyboardShortcuts({
    shortcuts: allShortcuts,
    sequenceShortcuts,
    enabled: true,
    sequenceTimeout: 1000
  })

  const contextValue: KeyboardShortcutsContextValue = useMemo(
    () => ({
      shortcuts: allShortcuts,
      displayShortcuts,
      isHelpModalOpen,
      toggleHelpModal,
      openHelpModal,
      closeHelpModal,
      registerShortcut,
      unregisterShortcut
    }),
    [
      allShortcuts,
      displayShortcuts,
      isHelpModalOpen,
      toggleHelpModal,
      openHelpModal,
      closeHelpModal,
      registerShortcut,
      unregisterShortcut
    ]
  )

  return (
    <KeyboardShortcutsContext.Provider value={contextValue}>
      {children}
      <KeyboardShortcutsModal isOpen={isHelpModalOpen} onClose={closeHelpModal} shortcuts={displayShortcuts} />
    </KeyboardShortcutsContext.Provider>
  )
}

export default KeyboardShortcutsProvider
