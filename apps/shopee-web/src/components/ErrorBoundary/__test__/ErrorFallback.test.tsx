import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ErrorFallback from '../ErrorFallback'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}))

let mockReducedMotion = false

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, animated, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

describe('ErrorFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReducedMotion = false
  })

  it('should render with default props', () => {
    render(<ErrorFallback />)
    expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument()
    expect(screen.getByText('Không thể tải dữ liệu. Vui lòng thử lại.')).toBeInTheDocument()
  })

  it('should render custom title and message', () => {
    render(<ErrorFallback title="Custom Error" message="Custom message" />)
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Custom message')).toBeInTheDocument()
  })

  it('should render retry button by default', () => {
    const resetFn = vi.fn()
    render(<ErrorFallback resetErrorBoundary={resetFn} />)
    expect(screen.getByText('Thử lại')).toBeInTheDocument()
  })

  it('should not render retry button when showRetry is false', () => {
    render(<ErrorFallback showRetry={false} />)
    expect(screen.queryByText('Thử lại')).not.toBeInTheDocument()
  })

  it('should call resetErrorBoundary when retry button is clicked', async () => {
    const resetFn = vi.fn()
    render(<ErrorFallback resetErrorBoundary={resetFn} />)

    const retryButton = screen.getByText('Thử lại')
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(resetFn).toHaveBeenCalledTimes(1)
    })
  })

  it('should show loading state when retrying', async () => {
    const resetFn = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)))
    render(<ErrorFallback resetErrorBoundary={resetFn} />)

    const retryButton = screen.getByText('Thử lại')
    fireEvent.click(retryButton)

    expect(screen.getByText('Đang thử lại...')).toBeInTheDocument()
  })

  it('should render custom retry text', () => {
    const resetFn = vi.fn()
    render(<ErrorFallback resetErrorBoundary={resetFn} retryText="Retry Now" />)
    expect(screen.getByText('Retry Now')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(<ErrorFallback className="custom-error" />)
    expect(container.querySelector('.custom-error')).toBeInTheDocument()
  })

  it('should show error details in development mode', () => {
    // import.meta.env.DEV is true by default in Vitest test mode
    const error = new Error('Test error message')
    error.stack = 'Error stack trace'

    render(<ErrorFallback error={error} />)

    expect(screen.getByText('Chi tiết lỗi (Dev)')).toBeInTheDocument()
  })

  it('should not render retry button when resetErrorBoundary is not provided', () => {
    render(<ErrorFallback showRetry={true} />)
    expect(screen.queryByText('Thử lại')).not.toBeInTheDocument()
  })

  it('should disable retry button while retrying', async () => {
    const resetFn = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)))
    render(<ErrorFallback resetErrorBoundary={resetFn} />)

    const retryButton = screen.getByRole('button', { name: 'Thử lại' })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(retryButton).toBeDisabled()
    })
  })

  it('should render with reduced motion', () => {
    mockReducedMotion = true

    render(<ErrorFallback />)
    expect(screen.getByText('Đã xảy ra lỗi')).toBeInTheDocument()
  })
})
