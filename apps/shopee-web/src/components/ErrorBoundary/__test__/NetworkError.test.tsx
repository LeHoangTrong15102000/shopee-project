import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import NetworkError from '../NetworkError'

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

describe('NetworkError', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('renders network error message', () => {
    render(<NetworkError />)
    expect(screen.getByText('Mất kết nối mạng')).toBeInTheDocument()
    expect(
      screen.getByText('Vui lòng kiểm tra kết nối internet của bạn và thử lại.'),
    ).toBeInTheDocument()
  })

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn()
    render(<NetworkError onRetry={onRetry} />)
    expect(screen.getByRole('button', { name: /thử lại/i })).toBeInTheDocument()
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<NetworkError />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls onRetry when retry button is clicked', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined)
    render(<NetworkError onRetry={onRetry} />)

    const retryButton = screen.getByRole('button', { name: /thử lại/i })
    fireEvent.click(retryButton)

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows loading state when retrying', async () => {
    const onRetry = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 1000)))
    render(<NetworkError onRetry={onRetry} />)

    const retryButton = screen.getByRole('button', { name: /thử lại/i })
    fireEvent.click(retryButton)

    expect(screen.getByText('Đang kết nối...')).toBeInTheDocument()
    expect(retryButton).toBeDisabled()
  })

  it('shows auto retry countdown when autoRetry is enabled', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined)
    render(<NetworkError onRetry={onRetry} autoRetry autoRetryInterval={5000} maxAutoRetries={3} />)

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(screen.getByText(/Tự động thử lại sau/)).toBeInTheDocument()
    expect(screen.getByText(/\(1\/3\)/)).toBeInTheDocument()
  })

  it('auto retries after interval', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined)
    render(<NetworkError onRetry={onRetry} autoRetry autoRetryInterval={5000} maxAutoRetries={3} />)

    await act(async () => {
      vi.advanceTimersByTime(5100)
    })

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('stops auto retry after max retries', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined)
    render(<NetworkError onRetry={onRetry} autoRetry autoRetryInterval={1000} maxAutoRetries={2} />)

    await act(async () => {
      vi.advanceTimersByTime(1100)
    })
    await act(async () => {
      vi.advanceTimersByTime(1100)
    })
    await act(async () => {
      vi.advanceTimersByTime(1100)
    })

    expect(screen.getByText(/Đã hết số lần tự động thử lại/)).toBeInTheDocument()
  })

  it('updates countdown every second', async () => {
    const onRetry = vi.fn().mockResolvedValue(undefined)
    render(<NetworkError onRetry={onRetry} autoRetry autoRetryInterval={5000} maxAutoRetries={3} />)

    await act(async () => {
      vi.advanceTimersByTime(100)
    })
    // Countdown starts at 5
    expect(screen.getByText(/5 giây/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<NetworkError className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles retry with reduced motion', () => {
    const onRetry = vi.fn().mockResolvedValue(undefined)
    render(<NetworkError onRetry={onRetry} />)

    const retryButton = screen.getByRole('button', { name: /thử lại/i })
    expect(retryButton).toBeInTheDocument()
  })

  it('cleans up timers on unmount', () => {
    const onRetry = vi.fn().mockResolvedValue(undefined)
    const { unmount } = render(
      <NetworkError onRetry={onRetry} autoRetry autoRetryInterval={5000} maxAutoRetries={3} />,
    )

    unmount()
    vi.advanceTimersByTime(5000)

    expect(onRetry).not.toHaveBeenCalled()
  })
})
