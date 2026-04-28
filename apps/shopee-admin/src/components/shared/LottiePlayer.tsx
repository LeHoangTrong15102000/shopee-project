import { Component, type ReactNode } from 'react'
import Lottie from 'lottie-react'
import { useReducedMotion } from 'motion/react'

interface LottiePlayerProps {
  animationData: object
  fallback?: ReactNode
  width?: number
  height?: number
  loop?: boolean
  autoplay?: boolean
  className?: string
}

class LottieErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}

function LottiePlayerInner({
  animationData,
  fallback,
  width = 80,
  height = 80,
  loop = true,
  autoplay = true,
  className,
}: LottiePlayerProps) {
  const prefersReducedMotion = useReducedMotion()

  if (prefersReducedMotion) {
    return <>{fallback ?? null}</>
  }

  return (
    <LottieErrorBoundary fallback={fallback ?? null}>
      <Lottie
        animationData={animationData}
        loop={loop}
        autoplay={autoplay}
        style={{ width, height }}
        className={className}
      />
    </LottieErrorBoundary>
  )
}

export function LottiePlayer(props: LottiePlayerProps) {
  return (
    <LottieErrorBoundary fallback={props.fallback ?? null}>
      <LottiePlayerInner {...props} />
    </LottieErrorBoundary>
  )
}
