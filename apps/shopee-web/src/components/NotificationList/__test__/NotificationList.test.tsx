import { describe, it, expect} from 'vitest'
import { render, screen } from '@testing-library/react'
import NotificationList from '../NotificationList'

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

const mockMarkAsRead = { mutate: vi.fn(), isPending: false }
const mockMarkAllAsRead = { mutate: vi.fn(), isPending: false }
vi.mock('src/hooks/optimistic', () => ({
  useOptimisticNotification: () => ({
    markAsReadMutation: mockMarkAsRead,
    markAllAsReadMutation: mockMarkAllAsRead,
  }),
}))

const mockNotifications: any[] = []
let mockUnreadCount = 0
let mockIsLoading = false
vi.mock('src/hooks/useNotifications', () => ({
  default: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    isLoading: mockIsLoading,
  }),
}))

vi.mock('src/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: () => ({ handleKeyDown: vi.fn() }),
}))

vi.mock('src/utils/utils', () => ({
  formatTimeAgo: (d: string) => '5 phút trước',
}))

const makeNotification = (id: string, type: string, isRead: boolean) => ({
  _id: id,
  type,
  title: `Title ${id}`,
  content: `Content ${id}`,
  isRead,
  createdAt: '2026-03-19T08:00:00Z',
})

describe('NotificationList', () => {
  it('renders loading state', () => {
    mockIsLoading = true
    mockNotifications.length = 0
    render(<NotificationList />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    mockIsLoading = false
  })

  it('renders empty state', () => {
    mockNotifications.length = 0
    render(<NotificationList />)
    expect(screen.getByText('Không có thông báo nào')).toBeInTheDocument()
  })

  it('renders notification list with items', () => {
    mockNotifications.length = 0
    mockNotifications.push(
      makeNotification('1', 'order', false),
      makeNotification('2', 'promotion', true),
    )
    mockUnreadCount = 1
    render(<NotificationList />)
    expect(screen.getByText('Title 1')).toBeInTheDocument()
    expect(screen.getByText('Title 2')).toBeInTheDocument()
  })

  it('renders unread count badge when > 0', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'order', false))
    mockUnreadCount = 3
    render(<NotificationList />)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('hides unread badge when count is 0', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'order', true))
    mockUnreadCount = 0
    render(<NotificationList />)
    expect(screen.queryByText(/^\d+$/)).toBeNull()
  })

  it('renders mark all read button when unread > 0', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'order', false))
    mockUnreadCount = 1
    render(<NotificationList />)
    expect(screen.getByText('Đánh dấu tất cả đã đọc')).toBeInTheDocument()
  })

  it('renders all read message when unread is 0', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'order', true))
    mockUnreadCount = 0
    render(<NotificationList />)
    expect(screen.getByText(/Đã đọc tất cả/)).toBeInTheDocument()
  })

  it('renders order notification type icon', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'order', false))
    mockUnreadCount = 1
    const { container } = render(<NotificationList />)
    const greenIcon = container.querySelector('.bg-green-100')
    expect(greenIcon).not.toBeNull()
  })

  it('renders promotion notification type icon', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'promotion', true))
    mockUnreadCount = 0
    const { container } = render(<NotificationList />)
    const redIcon = container.querySelector('.bg-red-100')
    expect(redIcon).not.toBeNull()
  })

  it('renders system notification type icon', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'system', true))
    mockUnreadCount = 0
    const { container } = render(<NotificationList />)
    const blueIcon = container.querySelector('.bg-blue-100')
    expect(blueIcon).not.toBeNull()
  })

  it('renders other notification type icon', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'other', true))
    mockUnreadCount = 0
    const { container } = render(<NotificationList />)
    const grayIcon = container.querySelector('.bg-gray-100')
    expect(grayIcon).not.toBeNull()
  })

  it('renders unread dot for unread notifications', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'order', false))
    mockUnreadCount = 1
    const { container } = render(<NotificationList />)
    const dot = container.querySelector('.bg-orange.rounded-full.h-2.w-2')
    expect(dot).not.toBeNull()
  })

  it('renders time ago for notifications', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'order', true))
    mockUnreadCount = 0
    render(<NotificationList />)
    expect(screen.getAllByText('5 phút trước').length).toBeGreaterThanOrEqual(1)
  })

  it('renders view all button', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'order', true))
    mockUnreadCount = 0
    render(<NotificationList />)
    expect(screen.getByText('Xem tất cả')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    mockNotifications.length = 0
    mockNotifications.push(makeNotification('1', 'order', true))
    mockUnreadCount = 0
    const { container } = render(<NotificationList className="custom-class" />)
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
