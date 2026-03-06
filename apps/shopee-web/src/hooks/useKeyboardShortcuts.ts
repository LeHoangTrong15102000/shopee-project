import { useEffect, useCallback, useRef } from 'react'

export interface Shortcut {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  description: string
  action: () => void
  category: string
}

// Sequence shortcut: e.g., "g then h" for navigating to home
export interface SequenceShortcut {
  sequence: string[] // e.g., ['g', 'h']
  description: string
  action: () => void
  category: string
}

interface UseKeyboardShortcutsOptions {
  shortcuts: Shortcut[]
  sequenceShortcuts?: SequenceShortcut[]
  enabled?: boolean
  sequenceTimeout?: number // timeout in ms for sequence detection (default: 1000)
}

const isInputElement = (element: Element | null): boolean => {
  if (!element) return false

  const tagName = element.tagName.toLowerCase()
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true
  }

  if (element instanceof HTMLElement && element.isContentEditable) {
    return true
  }

  return false
}

const matchesShortcut = (event: KeyboardEvent, shortcut: Shortcut): boolean => {
  const eventKey = event.key.toLowerCase()
  const shortcutKey = shortcut.key.toLowerCase()

  if (shortcut.key === '?') {
    if (eventKey !== '?' && !(event.shiftKey && eventKey === '/')) {
      return false
    }
  } else if (eventKey !== shortcutKey) {
    return false
  }

  const ctrlOrMeta = event.ctrlKey || event.metaKey
  const requiresCtrlOrMeta = shortcut.ctrlKey || shortcut.metaKey

  if (requiresCtrlOrMeta && !ctrlOrMeta) return false
  if (!requiresCtrlOrMeta && ctrlOrMeta && shortcut.key !== 'Escape') return false

  if (shortcut.shiftKey && !event.shiftKey) return false

  return true
}

export function useKeyboardShortcuts({
  shortcuts,
  sequenceShortcuts = [],
  enabled = true,
  sequenceTimeout = 1000
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts)
  shortcutsRef.current = shortcuts

  const sequenceShortcutsRef = useRef(sequenceShortcuts)
  sequenceShortcutsRef.current = sequenceShortcuts

  // Track sequence state
  const sequenceBufferRef = useRef<string[]>([])
  const sequenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetSequence = useCallback(() => {
    sequenceBufferRef.current = []
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current)
      sequenceTimeoutRef.current = null
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return

      const activeElement = document.activeElement
      const isTyping = isInputElement(activeElement)
      const eventKey = event.key.toLowerCase()
      const isEscape = eventKey === 'escape'

      // Always allow Escape to work
      if (isEscape) {
        for (const shortcut of shortcutsRef.current) {
          if (shortcut.key.toLowerCase() === 'escape') {
            event.preventDefault()
            event.stopPropagation()
            shortcut.action()
            resetSequence()
            return
          }
        }
      }

      // Skip other shortcuts when typing in input fields
      if (isTyping) {
        return
      }

      // Check for sequence shortcuts first
      if (sequenceShortcutsRef.current.length > 0) {
        // Add key to sequence buffer
        sequenceBufferRef.current.push(eventKey)

        // Reset timeout
        if (sequenceTimeoutRef.current) {
          clearTimeout(sequenceTimeoutRef.current)
        }

        // Check if current buffer matches any sequence
        for (const seqShortcut of sequenceShortcutsRef.current) {
          const sequence = seqShortcut.sequence.map((k) => k.toLowerCase())
          const buffer = sequenceBufferRef.current

          // Check if buffer matches the sequence
          if (buffer.length === sequence.length) {
            const matches = buffer.every((key, index) => key === sequence[index])
            if (matches) {
              event.preventDefault()
              event.stopPropagation()
              seqShortcut.action()
              resetSequence()
              return
            }
          }

          // Check if buffer is a valid prefix of any sequence
          const isValidPrefix = sequence.slice(0, buffer.length).every((key, index) => key === buffer[index])
          if (isValidPrefix && buffer.length < sequence.length) {
            // Valid prefix, set timeout to reset
            sequenceTimeoutRef.current = setTimeout(resetSequence, sequenceTimeout)
            // Don't process single-key shortcuts if we're in a sequence
            if (buffer.length > 0 && buffer[0] === 'g') {
              event.preventDefault()
              return
            }
          }
        }

        // If buffer doesn't match any sequence prefix, reset and continue
        const isAnyPrefix = sequenceShortcutsRef.current.some((seqShortcut) => {
          const sequence = seqShortcut.sequence.map((k) => k.toLowerCase())
          return sequence
            .slice(0, sequenceBufferRef.current.length)
            .every((key, index) => key === sequenceBufferRef.current[index])
        })

        if (!isAnyPrefix) {
          resetSequence()
        }
      }

      // Check single-key shortcuts
      for (const shortcut of shortcutsRef.current) {
        if (!matchesShortcut(event, shortcut)) continue

        const requiresModifier = shortcut.ctrlKey || shortcut.metaKey

        if (isTyping && !requiresModifier && !isEscape) {
          continue
        }

        // Don't trigger single-key shortcuts if we're in a sequence
        if (sequenceBufferRef.current.length > 0) {
          continue
        }

        event.preventDefault()
        event.stopPropagation()
        shortcut.action()
        return
      }
    },
    [enabled, resetSequence, sequenceTimeout]
  )

  useEffect(() => {
    if (!enabled) return

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      resetSequence()
    }
  }, [handleKeyDown, enabled, resetSequence])
}

export default useKeyboardShortcuts
