import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAInstallReturn {
  isInstallable: boolean
  isInstalled: boolean
  promptInstall: () => Promise<void>
  dismissPrompt: () => void
}

const DISMISS_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

function isDismissed(): boolean {
  const dismissedAt = localStorage.getItem(DISMISS_KEY)
  if (!dismissedAt) return false

  const dismissedTime = parseInt(dismissedAt, 10)
  const now = Date.now()

  if (now - dismissedTime > DISMISS_DURATION) {
    localStorage.removeItem(DISMISS_KEY)
    return false
  }

  return true
}

export function usePWAInstall(): UsePWAInstallReturn {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isDismissedState, setIsDismissedState] = useState(isDismissed)

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    setIsInstalled(isStandalone)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    setDeferredPrompt(null)
  }, [deferredPrompt])

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
    setIsDismissedState(true)
  }, [])

  const isInstallable = deferredPrompt !== null && !isInstalled && !isDismissedState

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt
  }
}

export default usePWAInstall
