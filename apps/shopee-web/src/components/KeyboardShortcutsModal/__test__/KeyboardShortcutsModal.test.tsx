import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import KeyboardShortcutsModal from '../KeyboardShortcutsModal'

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => true,
}))

vi.mock('src/styles/animations', () => ({
  ANIMATION_DURATION: { fast: 0.1, normal: 0.2 },
  ANIMATION_EASING: { easeOut: [0, 0, 0.2, 1] },
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

const mockShortcuts = [
  { key: 's', ctrlKey: true, description: 'Tìm kiếm', category: 'Điều hướng' },
  { key: 'Escape', description: 'Đóng', category: 'Điều hướng' },
  { key: '?', description: 'Hiện phím tắt', category: 'Chung' },
  { keys: ['g', 'h'], key: 'g', description: 'Về trang chủ', category: 'Chung' },
]

describe('KeyboardShortcutsModal', () => {
  it('renders when open', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />)
    expect(screen.getByText('Phím tắt')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} shortcuts={mockShortcuts} />)
    expect(screen.queryByText('Phím tắt')).not.toBeInTheDocument()
  })

  it('renders shortcut descriptions', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />)
    expect(screen.getByText('Tìm kiếm')).toBeInTheDocument()
    expect(screen.getByText('Đóng')).toBeInTheDocument()
    expect(screen.getByText('Hiện phím tắt')).toBeInTheDocument()
  })

  it('renders category headers', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />)
    expect(screen.getByText('Điều hướng')).toBeInTheDocument()
    expect(screen.getByText('Chung')).toBeInTheDocument()
  })

  it('renders key badges', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />)
    expect(screen.getByText('Esc')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders Ctrl modifier for ctrl shortcuts', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />)
    expect(screen.getByText('Ctrl')).toBeInTheDocument()
  })

  it('renders sequence shortcuts with then separator', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />)
    expect(screen.getByText('G')).toBeInTheDocument()
    expect(screen.getByText('H')).toBeInTheDocument()
    expect(screen.getByText('rồi')).toBeInTheDocument()
  })

  it('has dialog role', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape key', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} shortcuts={mockShortcuts} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('has close button', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />)
    expect(screen.getByLabelText('Đóng')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    const onClose = vi.fn()
    render(<KeyboardShortcutsModal isOpen={true} onClose={onClose} shortcuts={mockShortcuts} />)
    fireEvent.click(screen.getByLabelText('Đóng'))
    expect(onClose).toHaveBeenCalled()
  })
})
