import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationList from '../NotificationList/NotificationList';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => {
      if (opts?.count !== undefined) return `${key}_${opts.count}`;
      return key;
    },
  }),
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, disabled, animated, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('src/utils/utils', () => ({
  formatTimeAgo: vi.fn(() => '2 hours ago'),
}));

const mockMarkAsRead = { mutate: vi.fn(), isPending: false };
const mockMarkAllAsRead = { mutate: vi.fn(), isPending: false };

vi.mock('src/hooks/optimistic', () => ({
  useOptimisticNotification: () => ({
    markAsReadMutation: mockMarkAsRead,
    markAllAsReadMutation: mockMarkAllAsRead,
  }),
}));

let mockNotificationsReturn: any = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
};

vi.mock('src/hooks/useNotifications', () => ({
  default: () => mockNotificationsReturn,
}));

vi.mock('src/hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: ({ onEnter }: any) => ({
    handleKeyDown: (e: any) => {
      if (e.key === 'Enter') onEnter?.();
    },
  }),
}));

const makeNotification = (overrides: any = {}) => ({
  _id: 'n1',
  type: 'order',
  title: 'Order shipped',
  content: 'Your order has been shipped',
  isRead: false,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

describe('NotificationList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMarkAsRead.mutate.mockReset();
    mockMarkAsRead.isPending = false;
    mockMarkAllAsRead.mutate.mockReset();
    mockMarkAllAsRead.isPending = false;
    mockNotificationsReturn = { notifications: [], unreadCount: 0, isLoading: false };
  });

  it('shows loading state', () => {
    mockNotificationsReturn = { notifications: [], unreadCount: 0, isLoading: true };
    render(<NotificationList />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('loading')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    render(<NotificationList />);
    expect(screen.getByText('noNotifications')).toBeInTheDocument();
  });

  it('renders notification list with items', () => {
    mockNotificationsReturn = {
      notifications: [
        makeNotification({ _id: 'n1', title: 'Order shipped' }),
        makeNotification({ _id: 'n2', type: 'promotion', title: 'Flash sale', isRead: true }),
      ],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    expect(screen.getByText('Order shipped')).toBeInTheDocument();
    expect(screen.getByText('Flash sale')).toBeInTheDocument();
  });

  it('shows unread count badge when unread > 0', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification()],
      unreadCount: 3,
      isLoading: false,
    };
    render(<NotificationList />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('marks notification as read on click', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', isRead: false })],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(mockMarkAsRead.mutate).toHaveBeenCalledWith('n1');
  });

  it('does not mark already-read notification on click', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', isRead: true })],
      unreadCount: 0,
      isLoading: false,
    };
    render(<NotificationList />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(mockMarkAsRead.mutate).not.toHaveBeenCalled();
  });

  it('marks notification as read on Enter key', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', isRead: false })],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    fireEvent.keyDown(screen.getByRole('listitem'), { key: 'Enter' });
    expect(mockMarkAsRead.mutate).toHaveBeenCalledWith('n1');
  });

  it('marks notification as read on Space key', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', isRead: false })],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    fireEvent.keyDown(screen.getByRole('listitem'), { key: ' ' });
    expect(mockMarkAsRead.mutate).toHaveBeenCalledWith('n1');
  });

  it('shows mark all as read button when unread > 0', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification()],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    expect(screen.getByText('markAllRead')).toBeInTheDocument();
  });

  it('calls markAllAsRead when button clicked', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification()],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    fireEvent.click(screen.getByText('markAllRead'));
    expect(mockMarkAllAsRead.mutate).toHaveBeenCalled();
  });

  it('shows all-read checkmark when unreadCount is 0', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ isRead: true })],
      unreadCount: 0,
      isLoading: false,
    };
    render(<NotificationList />);
    expect(screen.getByText(/allRead/)).toBeInTheDocument();
  });

  it('renders order type icon', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', type: 'order' })],
      unreadCount: 1,
      isLoading: false,
    };
    const { container } = render(<NotificationList />);
    expect(container.querySelector('.bg-green-100')).toBeInTheDocument();
  });

  it('renders promotion type icon', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', type: 'promotion' })],
      unreadCount: 1,
      isLoading: false,
    };
    const { container } = render(<NotificationList />);
    expect(container.querySelector('.bg-red-100')).toBeInTheDocument();
  });

  it('renders system type icon', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', type: 'system' })],
      unreadCount: 1,
      isLoading: false,
    };
    const { container } = render(<NotificationList />);
    expect(container.querySelector('.bg-blue-100')).toBeInTheDocument();
  });

  it('renders other type icon', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', type: 'other' })],
      unreadCount: 1,
      isLoading: false,
    };
    const { container } = render(<NotificationList />);
    // 'other' type uses gray background
    expect(container.querySelector('.bg-gray-100')).toBeInTheDocument();
  });

  it('shows unread dot for unread notifications', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ isRead: false })],
      unreadCount: 1,
      isLoading: false,
    };
    const { container } = render(<NotificationList />);
    expect(container.querySelector('.bg-orange.rounded-full')).toBeInTheDocument();
  });

  it('shows view all button', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification()],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    expect(screen.getByText('viewAll')).toBeInTheDocument();
  });

  it('applies className prop', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification()],
      unreadCount: 0,
      isLoading: false,
    };
    const { container } = render(<NotificationList className="custom-class" />);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('shows processing text when markAll is pending', () => {
    mockMarkAllAsRead.isPending = true;
    mockNotificationsReturn = {
      notifications: [makeNotification()],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    expect(screen.getByText('processing')).toBeInTheDocument();
  });

  it('displays notification content and time', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ content: 'Package arriving tomorrow' })],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    expect(screen.getByText('Package arriving tomorrow')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('does not mark as read when mutation is pending', () => {
    mockMarkAsRead.isPending = true;
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', isRead: false })],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(mockMarkAsRead.mutate).not.toHaveBeenCalled();
  });

  it('does not mark as read on Enter when mutation is pending', () => {
    mockMarkAsRead.isPending = true;
    mockNotificationsReturn = {
      notifications: [makeNotification({ _id: 'n1', isRead: false })],
      unreadCount: 1,
      isLoading: false,
    };
    render(<NotificationList />);
    fireEvent.keyDown(screen.getByRole('listitem'), { key: 'Enter' });
    expect(mockMarkAsRead.mutate).not.toHaveBeenCalled();
  });

  it('applies unread styling to unread notifications', () => {
    mockNotificationsReturn = {
      notifications: [makeNotification({ isRead: false })],
      unreadCount: 1,
      isLoading: false,
    };
    const { container } = render(<NotificationList />);
    expect(container.querySelector('.border-orange')).toBeInTheDocument();
  });
});
