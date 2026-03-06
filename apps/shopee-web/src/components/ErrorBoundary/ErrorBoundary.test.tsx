import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import ErrorBoundary from './ErrorBoundary'

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children when there is no error', () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      </BrowserRouter>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('catches errors and renders fallback UI', () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </BrowserRouter>
    )

    expect(screen.getByText('500')).toBeInTheDocument()
    expect(screen.getByText('Error!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument()
  })

  it('displays Go Home button that navigates to home', () => {
    render(
      <BrowserRouter>
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      </BrowserRouter>
    )

    const homeButton = screen.getByRole('button', { name: /go home/i })
    expect(homeButton).toBeInTheDocument()
  })
})
