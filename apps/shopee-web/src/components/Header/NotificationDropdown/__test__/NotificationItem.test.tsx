import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationItem from '../NotificationItem';
import { Notification } from 'src/types/notification.type';

let mockFormatDistanceToNow = vi.fn(() => '2 giờ trước');

vi.mock('date-fns', () => ({
  formatDistanceToNow: (...args: any[]) => mockFormatDistanceToNow(...args),
}));

vi.mock('date-fns/locale', () => ({
  vi: {},
}));

describe('NotificationItem', () => {
  const mockNotification: Notification = {
    _id: '1',
    title: 'Test Notification',
    content: 'This is a test notification',
    type: 'promotion',
    createdAt: '2024-01-01T00:00:00.000Z',
    read: false,
    user: 'user1',
  };

  it('should render notification with title and content', () => {
    render(<NotificationItem notification={mockNotification} />);
    expect(screen.getByText('Test Notification')).toBeInTheDocument();
    expect(screen.getByText('This is a test notification')).toBeInTheDocument();
  });

  it('should render formatted time', () => {
    render(<NotificationItem notification={mockNotification} />);
    expect(screen.getByText('2 giờ trước')).toBeInTheDocument();
  });

  it('should render promotion icon for promotion type', () => {
    render(<NotificationItem notification={mockNotification} />);
    const container = screen.getByText('Test Notification').closest('.cursor-pointer');
    expect(container?.querySelector('.bg-yellow-100')).toBeInTheDocument();
  });

  it('should render order icon for order type', () => {
    const orderNotification = { ...mockNotification, type: 'order' as const };
    render(<NotificationItem notification={orderNotification} />);
    const container = screen.getByText('Test Notification').closest('.cursor-pointer');
    expect(container?.querySelector('.bg-green-100')).toBeInTheDocument();
  });

  it('should render system icon for system type', () => {
    const systemNotification = { ...mockNotification, type: 'system' as const };
    render(<NotificationItem notification={systemNotification} />);
    const container = screen.getByText('Test Notification').closest('.cursor-pointer');
    expect(container?.querySelector('.bg-blue-100')).toBeInTheDocument();
  });

  it('should render default icon for other type', () => {
    const otherNotification = { ...mockNotification, type: 'other' as const };
    render(<NotificationItem notification={otherNotification} />);
    const container = screen.getByText('Test Notification').closest('.cursor-pointer');
    expect(container?.querySelector('.bg-gray-100')).toBeInTheDocument();
  });

  it('should call onMarkAsRead when clicked', () => {
    const onMarkAsRead = vi.fn();
    render(<NotificationItem notification={mockNotification} onMarkAsRead={onMarkAsRead} />);

    const notificationElement = screen.getByText('Test Notification').closest('div');
    if (notificationElement) {
      fireEvent.click(notificationElement);
    }

    expect(onMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('should not call onMarkAsRead when not provided', () => {
    render(<NotificationItem notification={mockNotification} />);

    const notificationElement = screen.getByText('Test Notification').closest('div');
    if (notificationElement) {
      fireEvent.click(notificationElement);
    }
    // Should not throw error
  });

  it('should handle invalid date gracefully', () => {
    mockFormatDistanceToNow = vi.fn(() => {
      throw new Error('Invalid date');
    });

    const invalidDateNotification = { ...mockNotification, createdAt: 'invalid-date' };
    render(<NotificationItem notification={invalidDateNotification} />);

    expect(screen.getByText('invalid-date')).toBeInTheDocument();
  });

  it('should show unread indicator', () => {
    render(<NotificationItem notification={mockNotification} />);
    const indicator = screen
      .getByText('Test Notification')
      .closest('div')
      ?.querySelector('.bg-orange');
    expect(indicator).toBeInTheDocument();
  });

  it('should have cursor-pointer class', () => {
    render(<NotificationItem notification={mockNotification} />);
    const container = screen.getByText('Test Notification').closest('.cursor-pointer');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('cursor-pointer');
  });

  it('should truncate long title', () => {
    const longTitleNotification = {
      ...mockNotification,
      title: 'This is a very long notification title that should be truncated',
    };
    render(<NotificationItem notification={longTitleNotification} />);
    const titleElement = screen.getByText(longTitleNotification.title);
    expect(titleElement).toHaveClass('line-clamp-1');
  });

  it('should truncate long content', () => {
    const longContentNotification = {
      ...mockNotification,
      content: 'This is a very long notification content that should be truncated to two lines',
    };
    render(<NotificationItem notification={longContentNotification} />);
    const contentElement = screen.getByText(longContentNotification.content);
    expect(contentElement).toHaveClass('line-clamp-2');
  });
});
