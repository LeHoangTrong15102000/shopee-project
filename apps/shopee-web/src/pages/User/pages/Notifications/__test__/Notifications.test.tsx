import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Notifications from '../Notifications'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('src/components/SEO', () => ({
  default: () => <div data-testid="seo" />,
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, className, type, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} className={className} type={type} {...props}>
      {children}
    </button>
  ),
}))

const mockToggleMute = vi.fn()
let mockNotificationSoundReturn: any = {
  isMuted: false,
  toggleMute: mockToggleMute,
  playNotificationSound: vi.fn(),
}

const mockMarkAsReadMutate = vi.fn()
const mockMarkAllAsReadMutate = vi.fn()
let mockOptimisticReturn: any = {
  markAsReadMutation: { mutate: mockMarkAsReadMutate, isPending: false },
  markAllAsReadMutation: { mutate: mockMarkAllAsReadMutate, isPending: false },
}

const mockNotifications = [
  {
    _id: 'notif-1',
    type: 'order',
    title: 'Order Update',
    content: 'Your order has been shipped',
    isRead: false,
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    _id: 'notif-2',
    type: 'promotion',
    title: 'New Promotion',
    content: 'Check out our new deals',
    isRead: true,
    createdAt: '2024-01-02T00:00:00.000Z',
  },
]
let mockNotificationsReturn: any = {
  notifications: mockNotifications,
  unreadCount: 1,
  isConnected: true,
  isLoading: false,
}

vi.mock('src/hooks/optimistic', () => ({
  useOptimisticNotification: () => mockOptimisticReturn,
}))

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}))

vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

vi.mock('src/hooks/useNotifications', () => ({
  default: () => mockNotificationsReturn,
}))

vi.mock('src/hooks/useNotificationSound', () => ({
  default: () => mockNotificationSoundReturn,
}))

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNotificationSoundReturn = {
      isMuted: false,
      toggleMute: mockToggleMute,
      playNotificationSound: vi.fn(),
    }
    mockOptimisticReturn = {
      markAsReadMutation: { mutate: mockMarkAsReadMutate, isPending: false },
      markAllAsReadMutation: { mutate: mockMarkAllAsReadMutate, isPending: false },
    }
    mockNotificationsReturn = {
      notifications: mockNotifications,
      unreadCount: 1,
      isConnected: true,
      isLoading: false,
    }
  })

  it('should render notifications list', () => {
    render(<Notifications />)
    expect(screen.getByText('Order Update')).toBeInTheDocument()
    expect(screen.getByText('New Promotion')).toBeInTheDocument()
  })

  it('should render filter tabs', () => {
    render(<Notifications />)
    expect(screen.getByText('Tất cả')).toBeInTheDocument()
    expect(screen.getByText('Đơn hàng')).toBeInTheDocument()
    expect(screen.getByText('Khuyến mãi')).toBeInTheDocument()
  })

  it('should show unread count', () => {
    render(<Notifications />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('should show connection status', () => {
    render(<Notifications />)
    expect(screen.getByText('Cập nhật thời gian thực')).toBeInTheDocument()
  })

  it('should toggle sound mute', () => {
    render(<Notifications />)
    const soundButton = screen.getByLabelText('Tắt âm thanh thông báo')
    fireEvent.click(soundButton)
    expect(mockToggleMute).toHaveBeenCalled()
  })

  it('should mark all as read', () => {
    render(<Notifications />)
    const markAllButton = screen.getByText('Đánh dấu tất cả đã đọc')
    fireEvent.click(markAllButton)
    expect(mockMarkAllAsReadMutate).toHaveBeenCalled()
  })

  it('should filter notifications by tab', () => {
    render(<Notifications />)
    const promotionTab = screen.getByText('Khuyến mãi')
    fireEvent.click(promotionTab)
    expect(screen.getByText('New Promotion')).toBeInTheDocument()
  })

  it('should mark notification as read when clicked', () => {
    render(<Notifications />)
    const unreadNotification = screen.getByText('Order Update').closest('li')
    if (unreadNotification) {
      fireEvent.click(unreadNotification)
      expect(mockMarkAsReadMutate).toHaveBeenCalledWith('notif-1')
    }
  })

  it('should show loading skeleton', () => {
    mockNotificationsReturn = {
      notifications: [],
      unreadCount: 0,
      isConnected: false,
      isLoading: true,
    }
    render(<Notifications />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should show empty state', () => {
    mockNotificationsReturn = {
      notifications: [],
      unreadCount: 0,
      isConnected: true,
      isLoading: false,
    }
    render(<Notifications />)
    expect(screen.getByText('Không có thông báo nào')).toBeInTheDocument()
  })
})
