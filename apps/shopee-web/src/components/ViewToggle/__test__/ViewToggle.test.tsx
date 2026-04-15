import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ViewToggle from '../ViewToggle'

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}))

describe('ViewToggle', () => {
  it('renders grid and list buttons', () => {
    render(<ViewToggle viewMode="grid" onViewChange={vi.fn()} />)
    expect(screen.getByLabelText('Xem dạng lưới')).toBeInTheDocument()
    expect(screen.getByLabelText('Xem dạng danh sách')).toBeInTheDocument()
  })

  it('marks grid as pressed when viewMode is grid', () => {
    render(<ViewToggle viewMode="grid" onViewChange={vi.fn()} />)
    expect(screen.getByLabelText('Xem dạng lưới')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Xem dạng danh sách')).toHaveAttribute('aria-pressed', 'false')
  })

  it('marks list as pressed when viewMode is list', () => {
    render(<ViewToggle viewMode="list" onViewChange={vi.fn()} />)
    expect(screen.getByLabelText('Xem dạng lưới')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByLabelText('Xem dạng danh sách')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onViewChange with grid when grid clicked', () => {
    const onChange = vi.fn()
    render(<ViewToggle viewMode="list" onViewChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Xem dạng lưới'))
    expect(onChange).toHaveBeenCalledWith('grid')
  })

  it('calls onViewChange with list when list clicked', () => {
    const onChange = vi.fn()
    render(<ViewToggle viewMode="grid" onViewChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Xem dạng danh sách'))
    expect(onChange).toHaveBeenCalledWith('list')
  })

  it('applies custom className', () => {
    const { container } = render(
      <ViewToggle viewMode="grid" onViewChange={vi.fn()} className="custom" />,
    )
    expect(container.firstChild).toHaveClass('custom')
  })
})
