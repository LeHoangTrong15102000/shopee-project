import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Pagination from '../Pagination'

vi.mock('src/hooks/nuqs', () => ({
  useProductQueryStates: () => [{ page: 1 }],
}))

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={typeof to === 'string' ? to : `${to.pathname}?${to.search}`} {...props}>
      {children}
    </a>
  ),
  createSearchParams: (params: Record<string, string>) => new URLSearchParams(params).toString(),
}))

describe('Pagination - Controlled Mode', () => {
  it('renders navigation', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('renders page buttons', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('disables prev button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('Trang trước')).toHaveAttribute('aria-disabled', 'true')
  })

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByLabelText('Trang sau')).toHaveAttribute('aria-disabled', 'true')
  })

  it('calls onPageChange when page clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('3'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange with next page', () => {
    const onPageChange = vi.fn()
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Đi đến trang sau'))
    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('calls onPageChange with prev page', () => {
    const onPageChange = vi.fn()
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByLabelText('Đi đến trang trước'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('marks current page with aria-current', () => {
    render(<Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />)
    expect(screen.getByText('3')).toHaveAttribute('aria-current', 'page')
  })

  it('returns null when totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    )
    expect(container.innerHTML).toBe('')
  })

  it('shows dots for many pages', () => {
    render(<Pagination currentPage={10} totalPages={20} onPageChange={vi.fn()} />)
    const dots = screen.getAllByText('...')
    expect(dots.length).toBeGreaterThanOrEqual(1)
  })
})
