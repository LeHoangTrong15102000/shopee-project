import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { Component, ErrorInfo, ReactNode } from 'react'
import ErrorFallback from './ErrorFallback'

interface QueryErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
  title?: string
  message?: string
}

interface QueryErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class QueryErrorBoundaryInner extends Component<
  QueryErrorBoundaryProps & { resetBoundary: () => void },
  QueryErrorBoundaryState
> {
  public state: QueryErrorBoundaryState = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): QueryErrorBoundaryState {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('QueryErrorBoundary caught error:', error, errorInfo)
  }

  public resetErrorBoundary = () => {
    this.props.resetBoundary()
    this.props.onReset?.()
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={this.resetErrorBoundary}
          title={this.props.title}
          message={this.props.message}
        />
      )
    }

    return this.props.children
  }
}

export default function QueryErrorBoundary({ children, fallback, onReset, title, message }: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary()

  return (
    <QueryErrorBoundaryInner
      resetBoundary={reset}
      fallback={fallback}
      onReset={onReset}
      title={title}
      message={message}
    >
      {children}
    </QueryErrorBoundaryInner>
  )
}
