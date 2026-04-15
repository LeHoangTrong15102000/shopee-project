import { useEffect } from 'react'
import type { Metric } from 'web-vitals'

type ReportFn = (metric: Metric) => void

export function useWebVitals(reportFn?: ReportFn) {
  useEffect(() => {
    const isDev = import.meta.env?.DEV ?? process.env.NODE_ENV === 'development'

    const handler: ReportFn = (metric) => {
      if (reportFn) {
        reportFn(metric)
      } else if (isDev) {
        console.log(`[Web Vitals] ${metric.name}: ${metric.value}`, metric)
      }
    }

    import('web-vitals')
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        onCLS(handler)
        onFCP(handler)
        onINP(handler)
        onLCP(handler)
        onTTFB(handler)
      })
      .catch(() => {
        // Silently fail — web-vitals not available
      })
  }, [reportFn])
}
