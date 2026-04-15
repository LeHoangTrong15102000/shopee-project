import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ShareButton from '../ShareButton'

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ariaLabel, animated, ...props }: any) => (
    <button onClick={onClick} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
}))

describe('ShareButton', () => {
  const defaultProps = {
    url: 'https://example.com/product/1',
    title: 'Test Product',
  }

  it('renders share button', () => {
    render(<ShareButton {...defaultProps} />)
    expect(screen.getByText('Chia sẻ')).toBeInTheDocument()
  })

  it('opens dropdown on click', () => {
    render(<ShareButton {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Chia sẻ sản phẩm'))
    expect(screen.getByText('Facebook')).toBeInTheDocument()
  })

  it('shows all share platforms', () => {
    render(<ShareButton {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Chia sẻ sản phẩm'))
    expect(screen.getByText('Facebook')).toBeInTheDocument()
    expect(screen.getByText('Twitter')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    expect(screen.getByText('Telegram')).toBeInTheDocument()
    expect(screen.getByText('Zalo')).toBeInTheDocument()
    expect(screen.getByText('Copy Link')).toBeInTheDocument()
  })

  it('does not show dropdown initially', () => {
    render(<ShareButton {...defaultProps} />)
    expect(screen.queryByText('Facebook')).not.toBeInTheDocument()
  })

  it('opens social share on platform click', () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null)
    render(<ShareButton {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Chia sẻ sản phẩm'))
    fireEvent.click(screen.getByText('Facebook'))
    expect(windowOpen).toHaveBeenCalled()
    windowOpen.mockRestore()
  })

  it('copies link on Copy Link click', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    render(<ShareButton {...defaultProps} />)
    fireEvent.click(screen.getByLabelText('Chia sẻ sản phẩm'))
    fireEvent.click(screen.getByText('Copy Link'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/product/1')
  })

  it('applies custom className', () => {
    const { container } = render(<ShareButton {...defaultProps} className="custom" />)
    expect(container.firstChild).toHaveClass('custom')
  })

  it('sets aria-expanded on toggle', () => {
    render(<ShareButton {...defaultProps} />)
    const btn = screen.getByLabelText('Chia sẻ sản phẩm')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
  })
})
