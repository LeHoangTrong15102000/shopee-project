import { useEffect, useState } from 'react'

interface DevicePerformance {
  isLowEnd: boolean
  shouldReduceAnimations: boolean
}

export function useDevicePerformance(): DevicePerformance {
  const [isLowEnd, setIsLowEnd] = useState(false)

  useEffect(() => {
    // Check device capabilities
    const memory = (navigator as unknown as Record<string, unknown>).deviceMemory as number | undefined
    const cores = navigator.hardwareConcurrency || 4
    const connection = (navigator as unknown as Record<string, unknown>).connection as
      | { effectiveType?: string }
      | undefined

    const lowMemory = memory !== undefined && memory < 4
    const lowCores = cores < 4
    const slowConnection = connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g'

    setIsLowEnd(lowMemory || (lowCores && slowConnection !== false))
  }, [])

  return {
    isLowEnd,
    shouldReduceAnimations: isLowEnd
  }
}
