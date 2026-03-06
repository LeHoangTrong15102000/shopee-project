import { useState, useCallback, useRef, useEffect } from 'react'

const STORAGE_KEY = 'notification_sound_enabled'

/**
 * Hook for playing notification sounds using Web Audio API
 * Includes mute/unmute toggle with localStorage persistence
 */
const useNotificationSound = () => {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'false' // Default to enabled (not muted)
  })

  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize AudioContext lazily (must be triggered by user interaction)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioContextRef.current
  }, [])

  // Play a subtle notification beep
  const playNotificationSound = useCallback(() => {
    if (isMuted) return

    try {
      const audioContext = getAudioContext()

      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume()
      }

      // Create oscillator for a pleasant notification tone
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure sound: soft, pleasant beep
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note
      oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1) // E5 note

      // Envelope: quick attack, smooth decay
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.02) // Quick attack
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3) // Smooth decay

      // Play the sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.warn('Failed to play notification sound:', error)
    }
  }, [isMuted, getAudioContext])

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev
      localStorage.setItem(STORAGE_KEY, String(!newValue)) // Store as "enabled" state
      return newValue
    })
  }, [])

  // Set mute state directly
  const setMuted = useCallback((muted: boolean) => {
    setIsMuted(muted)
    localStorage.setItem(STORAGE_KEY, String(!muted))
  }, [])

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
        audioContextRef.current = null
      }
    }
  }, [])

  return {
    isMuted,
    toggleMute,
    setMuted,
    playNotificationSound
  }
}

export default useNotificationSound
