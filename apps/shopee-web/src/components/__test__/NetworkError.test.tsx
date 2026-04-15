import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NetworkError from '../ErrorBoundary/NetworkError'

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

describe('NetworkError', () => {
  it('renders title', () => {
    render(<NetworkError />)
    expect(screen.getByText('Mất kết nối mạng')).toBeInTheDocument()
  })

  it('renders message', () => {
    render(<NetworkError />)
    expect(screen.getByText(/Vui lòng kiểm tra kết nối internet/)).toBeInTheDocument()
  })

  it('renders retry button when onRetry provided', () => {
    render(<NetworkError onRetry={vi.fn()} />)
    expect(screen.getByText('Thử lại')).toBeInTheDocument()
  })

  it('does not render retry button when no onRetry', () => {
    render(<NetworkError />)
    expect(screen.queryByText('Thử lại')).not.toBeInTheDocument()
  })

  it('calls onRetry when retry button clicked', () => {
    const onRetry = vi.fn()
    render(<NetworkError onRetry={onRetry} />)
    fireEvent.click(screen.getByText('Thử lại'))
    expect(onRetry).toHaveBeenCalled()
  })

  it('shows max retries message when autoRetry exhausted', () => {
    render(<NetworkError onRetry={vi.fn()} autoRetry={true} maxAutoRetries={0} />)
    expect(screen.getByText(/Đã hết số lần tự động thử lại/)).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<NetworkError className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
