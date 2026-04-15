import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import i18n from 'src/i18n/i18n'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6"
        >
          <AlertCircle className="mb-4 size-16 text-destructive" />
          <h1 className="text-2xl font-bold">{i18n.t('errorBoundary.title', { ns: 'common' })}</h1>
          <p className="mt-2 text-muted-foreground max-w-md">
            {this.state.error?.message || i18n.t('errorBoundary.defaultMessage', { ns: 'common' })}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-6">
            {i18n.t('errorBoundary.reload', { ns: 'common' })}
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
