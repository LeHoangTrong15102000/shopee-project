import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MobileAccountNav from '../MobileAccountNav'

const mockNavigate = vi.fn()
let mockPathname = '/user/profile'
vi.mock('react-router', () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ariaLabel, ...props }: any) => (
    <button onClick={onClick} className={className} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
}))

describe('MobileAccountNav', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockPathname = '/user/profile'
  })

  it('renders the trigger button', () => {
    render(<MobileAccountNav />)
    const btn = screen.getByRole('button', { name: 'Menu tài khoản' })
    expect(btn).toBeInTheDocument()
  })

  it('shows active item label', () => {
    render(<MobileAccountNav />)
    expect(screen.getByText('Tài khoản')).toBeInTheDocument()
  })

  it('opens dropdown on click', () => {
    render(<MobileAccountNav />)
    const trigger = screen.getByRole('button', { name: 'Menu tài khoản' })
    fireEvent.click(trigger)
    const listbox = screen.getByRole('listbox')
    expect(listbox).toBeInTheDocument()
  })

  it('shows all 9 nav items when open', () => {
    render(<MobileAccountNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu tài khoản' }))
    const options = screen.getAllByRole('option')
    expect(options.length).toBe(9)
  })

  it('marks active item with aria-selected', () => {
    render(<MobileAccountNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu tài khoản' }))
    const options = screen.getAllByRole('option')
    const activeOption = options.find((o) => o.getAttribute('aria-selected') === 'true')
    expect(activeOption).toBeDefined()
  })

  it('navigates when selecting an item', () => {
    render(<MobileAccountNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu tài khoản' }))
    const options = screen.getAllByRole('option')
    fireEvent.click(options[1])
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('closes on Escape key', () => {
    render(<MobileAccountNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu tài khoản' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('closes on click outside', () => {
    render(<MobileAccountNav />)
    fireEvent.click(screen.getByRole('button', { name: 'Menu tài khoản' }))
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('applies custom className', () => {
    const { container } = render(<MobileAccountNav className="test-class" />)
    expect(container.firstChild).toHaveClass('test-class')
  })
})
