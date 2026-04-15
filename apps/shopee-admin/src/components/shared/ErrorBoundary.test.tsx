import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from './ErrorBoundary'

// Mock i18n direct import used by class component
vi.mock('src/i18n/i18n', () => ({
  default: { t: (key: string) => key },
}))

function ThrowError() {
  throw new Error('Test error')
}

describe('ErrorBoundary', () => {
  // Suppress console.error for expected errors
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalError
  })

  it('catches render errors and shows fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('errorBoundary.title')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    )
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('shows reload button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('button', { name: /errorBoundary.reload/i })).toBeInTheDocument()
  })
})
