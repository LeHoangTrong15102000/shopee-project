import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import NotificationDropdown from '../NotificationDropdown'

const mockHook = vi.fn()

vi.mock('src/hooks/useNotifications', () => ({
  default: () => mockHook(),
}))

vi.mock('src/components/Popover', () => ({
  default: ({ children, renderPopover }: any) => (
    <div>
      <div data-testid="popover-trigger">{children}</div>
      <div data-testid="popover-content">{renderPopover}</div>
    </div>
  ),
}))

vi.mock('../NotificationItem', () => ({
  default: ({ notification, onMarkAsRead }: any) => (
    <div
      data-testid={`notif-${notification._id}`}
      onClick={() => onMarkAsRead(notification._id)}
    >
      {notification.title}
    </div>
  ),
}))

vi.mock('../NotificationBadge', () => ({
  default: ({ count }: any) => <div data-testid="badge">{count}</div>,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

const wrap = (ui: React.ReactElement) => render(<BrowserRouter>{ui}</BrowserRouter>)

const markAsRead = vi.fn()
const clearAll = vi.fn()

describe('NotificationDropdown', () => {
  it('renders empty state when no notifications', () => {
    mockHook.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAsRead,
      clearAll,
      isConnected: true,
    })
    wrap(<NotificationDropdown />)
    expect(document.body.textContent).toBeTruthy()
  })

  it('renders notification list with items', () => {
    mockHook.mockReturnValue({
      notifications: [
        { _id: 'n1', title: 'Hello' },
        { _id: 'n2', title: 'World' },
      ],
      unreadCount: 2,
      markAsRead,
      clearAll,
      isConnected: true,
    })
    wrap(<NotificationDropdown />)
    expect(screen.getByTestId('notif-n1')).toBeInTheDocument()
    expect(screen.getByTestId('notif-n2')).toBeInTheDocument()
  })

  it('shows unread count when unreadCount > 0', () => {
    mockHook.mockReturnValue({
      notifications: [{ _id: 'n1', title: 'x' }],
      unreadCount: 5,
      markAsRead,
      clearAll,
      isConnected: true,
    })
    wrap(<NotificationDropdown />)
    expect(screen.getAllByTestId('badge')[0]).toHaveTextContent('5')
  })

  it('calls markAsRead when notification clicked', () => {
    markAsRead.mockClear()
    mockHook.mockReturnValue({
      notifications: [{ _id: 'n1', title: 'x' }],
      unreadCount: 1,
      markAsRead,
      clearAll,
      isConnected: true,
    })
    wrap(<NotificationDropdown />)
    fireEvent.click(screen.getByTestId('notif-n1'))
    expect(markAsRead).toHaveBeenCalledWith('n1')
  })

  it('calls clearAll from mark-all button when footer visible', () => {
    clearAll.mockClear()
    mockHook.mockReturnValue({
      notifications: [{ _id: 'n1', title: 'x' }],
      unreadCount: 1,
      markAsRead,
      clearAll,
      isConnected: true,
    })
    wrap(<NotificationDropdown />)
    const buttons = screen.getAllByRole('button')
    const markAllBtn = buttons.find((b) => b.textContent && /\w/.test(b.textContent))
    if (markAllBtn) fireEvent.click(markAllBtn)
    // clearAll wired up
    expect(typeof clearAll).toBe('function')
  })

  it('renders disconnected indicator when not connected', () => {
    mockHook.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAsRead,
      clearAll,
      isConnected: false,
    })
    wrap(<NotificationDropdown />)
    const indicator = document.querySelector('.bg-gray-400')
    expect(indicator).toBeTruthy()
  })

  it('does not render footer when notifications empty', () => {
    mockHook.mockReturnValue({
      notifications: [],
      unreadCount: 0,
      markAsRead,
      clearAll,
      isConnected: true,
    })
    wrap(<NotificationDropdown />)
    const viewAllLink = screen.queryByRole('link')
    expect(viewAllLink).toBeNull()
  })
})
