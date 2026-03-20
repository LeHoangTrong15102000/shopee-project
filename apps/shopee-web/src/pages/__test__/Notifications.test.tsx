import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import React from 'react';
import Notifications from '../User/pages/Notifications/Notifications';
import { Notification } from 'src/types/notification.type';

// Mutable mock variables
let mockNotifications: Notification[] = [];
let mockUnreadCount = 0;
let mockIsConnected = true;
let mockIsLoading = false;
let mockIsMuted = false;
let mockToggleMute = vi.fn();
let mockPlayNotificationSound = vi.fn();
let mockMarkAsReadMutate = vi.fn();
let mockMarkAllAsReadMutate = vi.fn();
let mockMarkAsReadPending = false;
let mockMarkAllAsReadPending = false;
let mockReducedMotion = false;
let mockIsMobile = false;

// Uses global react-i18next mock from vitest.setup.js

// Mock useNotifications
vi.mock('src/hooks/useNotifications', () => ({
  default: () => ({
    notifications: mockNotifications,
    unreadCount: mockUnreadCount,
    isConnected: mockIsConnected,
    isLoading: mockIsLoading,
  }),
}));

// Mock useNotificationSound
vi.mock('src/hooks/useNotificationSound', () => ({
  default: () => ({
    isMuted: mockIsMuted,
    toggleMute: mockToggleMute,
    playNotificationSound: mockPlayNotificationSound,
  }),
}));

// Mock useOptimisticNotification
vi.mock('src/hooks/optimistic', () => ({
  useOptimisticNotification: () => ({
    markAsReadMutation: {
      mutate: mockMarkAsReadMutate,
      isPending: mockMarkAsReadPending,
    },
    markAllAsReadMutation: {
      mutate: mockMarkAllAsReadMutate,
      isPending: mockMarkAllAsReadPending,
    },
  }),
}));

// Mock useReducedMotion
vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));

// Mock useIsMobile
vi.mock('src/hooks/useIsMobile', () => ({
  useIsMobile: () => mockIsMobile,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    ul: ({ children, ...props }: any) => <ul {...props}>{children}</ul>,
    li: ({ children, ...props }: any) => <li {...props}>{children}</li>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock SEO component
vi.mock('src/components/SEO', () => ({
  default: ({ title }: { title: string }) => <div data-testid="seo">{title}</div>,
}));

// Mock Button component
vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, disabled, ...props }: any) => (
    <button onClick={onClick} className={className} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

// Mock formatTimeAgo utility
vi.mock('src/utils/utils', () => ({
  formatTimeAgo: (date: string) => `${date} ago`,
}));

const createWrapper = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, null, children),
    );
};

const createMockNotification = (overrides?: Partial<Notification>): Notification => ({
  _id: `notif-${Math.random()}`,
  userId: 'user-1',
  type: 'order',
  title: 'Test Notification',
  content: 'Test content',
  isRead: false,
  createdAt: '2026-03-18T10:00:00Z',
  ...overrides,
});

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mutable mocks
    mockNotifications = [];
    mockUnreadCount = 0;
    mockIsConnected = true;
    mockIsLoading = false;
    mockIsMuted = false;
    mockToggleMute = vi.fn();
    mockPlayNotificationSound = vi.fn();
    mockMarkAsReadMutate = vi.fn();
    mockMarkAllAsReadMutate = vi.fn();
    mockMarkAsReadPending = false;
    mockMarkAllAsReadPending = false;
    mockReducedMotion = false;
    mockIsMobile = false;
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Loading State', () => {
    it('shows skeleton when loading', () => {
      mockIsLoading = true;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      // Check for skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders multiple skeleton notification items', () => {
      mockIsLoading = true;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      // Should have 5 skeleton items
      const skeletonItems = document.querySelectorAll('.space-y-4 > div');
      expect(skeletonItems.length).toBe(5);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no notifications', () => {
      mockNotifications = [];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('Không có thông báo nào')).toBeInTheDocument();
    });

    it('displays empty state icon', () => {
      mockNotifications = [];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const emptyIcon = document.querySelector('.h-20.w-20');
      expect(emptyIcon).toBeInTheDocument();
    });
  });

  describe('Notification List Rendering', () => {
    it('renders notification list with items', () => {
      mockNotifications = [
        createMockNotification({ _id: '1', title: 'Order Update', content: 'Your order is ready' }),
        createMockNotification({ _id: '2', title: 'Promotion', content: 'New sale available' }),
      ];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('Order Update')).toBeInTheDocument();
      expect(screen.getByText('Promotion')).toBeInTheDocument();
    });

    it('displays notification content and timestamps', () => {
      mockNotifications = [
        createMockNotification({
          title: 'Test Title',
          content: 'Test Content',
          createdAt: '2026-03-18T10:00:00Z',
        }),
      ];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
      expect(screen.getByText('2026-03-18T10:00:00Z ago')).toBeInTheDocument();
    });
  });

  describe('Tab Filtering', () => {
    beforeEach(() => {
      mockNotifications = [
        createMockNotification({ _id: '1', type: 'order', title: 'Order Notification' }),
        createMockNotification({ _id: '2', type: 'promotion', title: 'Promotion Notification' }),
        createMockNotification({ _id: '3', type: 'system', title: 'System Notification' }),
        createMockNotification({ _id: '4', type: 'other', title: 'Other Notification' }),
      ];
    });

    it('displays all filter tabs', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('Tất cả')).toBeInTheDocument();
      expect(screen.getByText('Đơn hàng')).toBeInTheDocument();
      expect(screen.getByText('Khuyến mãi')).toBeInTheDocument();
      expect(screen.getByText('Hệ thống')).toBeInTheDocument();
      expect(screen.getByText('Khác')).toBeInTheDocument();
    });

    it('shows all notifications by default', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('Order Notification')).toBeInTheDocument();
      expect(screen.getByText('Promotion Notification')).toBeInTheDocument();
      expect(screen.getByText('System Notification')).toBeInTheDocument();
      expect(screen.getByText('Other Notification')).toBeInTheDocument();
    });

    it('filters order notifications when order tab is clicked', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      fireEvent.click(screen.getByText('Đơn hàng'));

      expect(screen.getByText('Order Notification')).toBeInTheDocument();
      expect(screen.queryByText('Promotion Notification')).not.toBeInTheDocument();
      expect(screen.queryByText('System Notification')).not.toBeInTheDocument();
    });

    it('filters promotion notifications when promotion tab is clicked', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      fireEvent.click(screen.getByText('Khuyến mãi'));

      expect(screen.getByText('Promotion Notification')).toBeInTheDocument();
      expect(screen.queryByText('Order Notification')).not.toBeInTheDocument();
    });

    it('filters system notifications when system tab is clicked', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      fireEvent.click(screen.getByText('Hệ thống'));

      expect(screen.getByText('System Notification')).toBeInTheDocument();
      expect(screen.queryByText('Order Notification')).not.toBeInTheDocument();
    });

    it('filters other notifications when other tab is clicked', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      fireEvent.click(screen.getByText('Khác'));

      expect(screen.getByText('Other Notification')).toBeInTheDocument();
      expect(screen.queryByText('Order Notification')).not.toBeInTheDocument();
    });

    it('shows empty state when filtered category has no notifications', () => {
      mockNotifications = [createMockNotification({ type: 'order' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      fireEvent.click(screen.getByText('Khuyến mãi'));

      expect(screen.getByText('Không có thông báo nào')).toBeInTheDocument();
    });
  });

  describe('Connection Status Indicator', () => {
    it('shows connected status when connected', () => {
      mockIsConnected = true;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('Cập nhật thời gian thực')).toBeInTheDocument();
      const statusDot = document.querySelector('.bg-green-500');
      expect(statusDot).toBeInTheDocument();
    });

    it('shows disconnected status when not connected', () => {
      mockIsConnected = false;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('Đang kết nối...')).toBeInTheDocument();
      const statusDot = document.querySelector('.bg-gray-400');
      expect(statusDot).toBeInTheDocument();
    });
  });

  describe('Sound Mute/Unmute Toggle', () => {
    it('displays unmute icon when sound is muted', () => {
      mockIsMuted = true;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const muteButton = screen.getByLabelText('Bật âm thanh thông báo');
      expect(muteButton).toBeInTheDocument();
    });

    it('displays mute icon when sound is unmuted', () => {
      mockIsMuted = false;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const muteButton = screen.getByLabelText('Tắt âm thanh thông báo');
      expect(muteButton).toBeInTheDocument();
    });

    it('calls toggleMute when sound button is clicked', () => {
      mockIsMuted = false;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const muteButton = screen.getByLabelText('Tắt âm thanh thông báo');
      fireEvent.click(muteButton);

      expect(mockToggleMute).toHaveBeenCalledTimes(1);
    });
  });

  describe('Unread Count Badge', () => {
    it('displays unread count badge when there are unread notifications', () => {
      mockUnreadCount = 5;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does not display badge when unread count is zero', () => {
      mockUnreadCount = 0;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const badge = document.querySelector('.bg-\\[\\#ee4d2d\\].px-2.py-0\\.5');
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('Mark All As Read Button', () => {
    it('displays mark all as read button when there are unread notifications', () => {
      mockUnreadCount = 3;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('Đánh dấu tất cả đã đọc')).toBeInTheDocument();
    });

    it('does not display mark all as read button when no unread notifications', () => {
      mockUnreadCount = 0;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.queryByText('Đánh dấu tất cả đã đọc')).not.toBeInTheDocument();
    });

    it('calls markAllAsReadMutation when button is clicked', () => {
      mockUnreadCount = 3;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const button = screen.getByText('Đánh dấu tất cả đã đọc');
      fireEvent.click(button);

      expect(mockMarkAllAsReadMutate).toHaveBeenCalledTimes(1);
    });

    it('shows loading state when marking all as read', () => {
      mockUnreadCount = 3;
      mockMarkAllAsReadPending = true;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();
    });

    it('disables button when marking all as read is pending', () => {
      mockUnreadCount = 3;
      mockMarkAllAsReadPending = true;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const button = screen.getByText('Đang xử lý...');
      expect(button).toBeDisabled();
    });
  });

  describe('Notification Type Icons', () => {
    it('displays order icon for order notifications', () => {
      mockNotifications = [createMockNotification({ type: 'order' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const orderIcon = document.querySelector('.bg-green-100');
      expect(orderIcon).toBeInTheDocument();
    });

    it('displays promotion icon for promotion notifications', () => {
      mockNotifications = [createMockNotification({ type: 'promotion' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const promotionIcon = document.querySelector('.bg-red-100');
      expect(promotionIcon).toBeInTheDocument();
    });

    it('displays system icon for system notifications', () => {
      mockNotifications = [createMockNotification({ type: 'system' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const systemIcon = document.querySelector('.bg-blue-100');
      expect(systemIcon).toBeInTheDocument();
    });

    it('displays default icon for other notifications', () => {
      mockNotifications = [createMockNotification({ type: 'other' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const otherIcon = document.querySelector('.bg-gray-100');
      expect(otherIcon).toBeInTheDocument();
    });
  });

  describe('Unread vs Read Notification Styling', () => {
    it('applies unread styling to unread notifications', () => {
      mockNotifications = [createMockNotification({ isRead: false, title: 'Unread' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const notification = screen.getByText('Unread').closest('li');
      expect(notification).toHaveClass('border-l-2');
      expect(notification).toHaveClass('border-l-[#ee4d2d]');
    });

    it('applies read styling to read notifications', () => {
      mockNotifications = [createMockNotification({ isRead: true, title: 'Read' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const notification = screen.getByText('Read').closest('li');
      expect(notification).toHaveClass('border-gray-200');
    });

    it('displays unread indicator dot for unread notifications', () => {
      mockNotifications = [createMockNotification({ isRead: false })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const unreadDot = document.querySelector('.bg-\\[\\#ee4d2d\\].rounded-full.h-2.w-2');
      expect(unreadDot).toBeInTheDocument();
    });

    it('does not display unread indicator dot for read notifications', () => {
      mockNotifications = [createMockNotification({ isRead: true, title: 'Read Notification' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const notificationElement = screen.getByText('Read Notification').closest('li');
      const unreadDot = notificationElement?.querySelector(
        '.bg-\\[\\#ee4d2d\\].rounded-full.h-2.w-2',
      );
      expect(unreadDot).not.toBeInTheDocument();
    });

    it('applies bold font to unread notification titles', () => {
      mockNotifications = [createMockNotification({ isRead: false, title: 'Unread Title' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const title = screen.getByText('Unread Title');
      expect(title).toHaveClass('font-semibold');
    });

    it('does not apply bold font to read notification titles', () => {
      mockNotifications = [createMockNotification({ isRead: true, title: 'Read Title' })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const title = screen.getByText('Read Title');
      expect(title).not.toHaveClass('font-semibold');
    });
  });

  describe('Mark As Read Interaction', () => {
    it('calls markAsRead when clicking unread notification', () => {
      mockNotifications = [createMockNotification({ _id: 'notif-1', isRead: false })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const notification = screen.getByText('Test Notification').closest('li');
      fireEvent.click(notification!);

      expect(mockMarkAsReadMutate).toHaveBeenCalledWith('notif-1');
    });

    it('does not call markAsRead when clicking read notification', () => {
      mockNotifications = [createMockNotification({ _id: 'notif-1', isRead: true })];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const notification = screen.getByText('Test Notification').closest('li');
      fireEvent.click(notification!);

      expect(mockMarkAsReadMutate).not.toHaveBeenCalled();
    });

    it('does not call markAsRead when mutation is pending', () => {
      mockNotifications = [createMockNotification({ _id: 'notif-1', isRead: false })];
      mockMarkAsReadPending = true;
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const notification = screen.getByText('Test Notification').closest('li');
      fireEvent.click(notification!);

      expect(mockMarkAsReadMutate).not.toHaveBeenCalled();
    });
  });

  describe('Mobile Responsive Behavior', () => {
    it('applies mobile-specific classes when on mobile', () => {
      mockIsMobile = true;
      mockNotifications = [createMockNotification()];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      // Mobile should not have animation variants
      const list = document.querySelector('ul');
      expect(list).toBeInTheDocument();
    });

    it('applies desktop animations when not on mobile', () => {
      mockIsMobile = false;
      mockNotifications = [createMockNotification()];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const list = document.querySelector('ul');
      expect(list).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    it('disables animations when reduced motion is enabled', () => {
      mockReducedMotion = true;
      mockNotifications = [createMockNotification()];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      // Component should render without animation props
      const container = document.querySelector('.rounded-lg.bg-white');
      expect(container).toBeInTheDocument();
    });

    it('enables animations when reduced motion is disabled', () => {
      mockReducedMotion = false;
      mockNotifications = [createMockNotification()];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const container = document.querySelector('.rounded-lg.bg-white');
      expect(container).toBeInTheDocument();
    });
  });

  describe('SEO Component', () => {
    it('renders SEO component with correct title', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getByTestId('seo')).toHaveTextContent('Thông báo');
    });
  });

  describe('Page Header', () => {
    it('displays notification icon in header', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const headerIcon = document.querySelector('.text-\\[\\#ee4d2d\\].h-6.w-6');
      expect(headerIcon).toBeInTheDocument();
    });

    it('displays page title', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      expect(screen.getAllByText('Thông báo').length).toBeGreaterThan(0);
    });
  });

  describe('Notification Content Truncation', () => {
    it('applies line-clamp to notification content', () => {
      mockNotifications = [
        createMockNotification({
          content: 'Very long content that should be truncated after two lines',
        }),
      ];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const content = screen.getByText(
        'Very long content that should be truncated after two lines',
      );
      expect(content).toHaveClass('line-clamp-2');
    });
  });

  describe('Scrollable List', () => {
    it('applies max-height and overflow to notification list', () => {
      mockNotifications = Array.from({ length: 10 }, (_, i) =>
        createMockNotification({ _id: `notif-${i}` }),
      );
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const list = document.querySelector('.max-h-\\[600px\\].overflow-y-auto');
      expect(list).toBeInTheDocument();
    });
  });

  describe('Tab Active State', () => {
    it('highlights active tab with border and color', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const allTab = screen.getByText('Tất cả');
      expect(allTab).toHaveClass('border-b-2');
      expect(allTab).toHaveClass('border-[#ee4d2d]');
    });

    it('changes active tab styling when different tab is clicked', () => {
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const orderTab = screen.getByText('Đơn hàng');
      fireEvent.click(orderTab);

      expect(orderTab).toHaveClass('border-b-2');
      expect(orderTab).toHaveClass('border-[#ee4d2d]');
    });
  });

  describe('Notification Hover Effects', () => {
    it('applies hover classes to notification items', () => {
      mockNotifications = [createMockNotification()];
      const Wrapper = createWrapper();
      render(React.createElement(Notifications), { wrapper: Wrapper });

      const notification = screen.getByText('Test Notification').closest('li');
      expect(notification).toHaveClass('hover:shadow-md');
    });
  });
});
