import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderTimeline from '../OrderTimeline';
import { purchasesStatus } from 'src/constant/purchase';

describe('OrderTimeline', () => {
  it('renders all step labels for active order', () => {
    render(<OrderTimeline orderId="123" currentStatus={purchasesStatus.waitForConfirmation} />);
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument();
    expect(screen.getByText('Chờ lấy hàng')).toBeInTheDocument();
    expect(screen.getByText('Đang giao')).toBeInTheDocument();
    expect(screen.getByText('Đã giao')).toBeInTheDocument();
  });

  it('renders cancelled state', () => {
    render(<OrderTimeline orderId="123" currentStatus={purchasesStatus.cancelled} />);
    expect(screen.getByText('Đơn hàng đã hủy')).toBeInTheDocument();
  });

  it('renders cancelled description', () => {
    render(<OrderTimeline orderId="123" currentStatus={purchasesStatus.cancelled} />);
    expect(screen.getByText(/Đơn hàng này đã bị hủy/)).toBeInTheDocument();
  });

  it('renders progressbar for active order', () => {
    render(<OrderTimeline orderId="123" currentStatus={purchasesStatus.inProgress} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('does not render progressbar for cancelled order', () => {
    render(<OrderTimeline orderId="123" currentStatus={purchasesStatus.cancelled} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders timestamps when provided', () => {
    const timestamps = {
      [purchasesStatus.waitForConfirmation]: '2024-01-15T10:30:00Z',
    };
    render(
      <OrderTimeline
        orderId="123"
        currentStatus={purchasesStatus.waitForConfirmation}
        timestamps={timestamps}
      />,
    );
    // formatDateTime outputs "HH:MM DD-MM-YYYY" in local timezone
    expect(screen.getByText(/\d{2}:\d{2} 15-01-2024/)).toBeInTheDocument();
  });

  it('does not render timestamps for future steps', () => {
    const timestamps = {
      [purchasesStatus.delivered]: '2024-01-15T10:30:00Z',
    };
    render(
      <OrderTimeline
        orderId="123"
        currentStatus={purchasesStatus.waitForConfirmation}
        timestamps={timestamps}
      />,
    );
    // Delivered timestamp should not show since current is waitForConfirmation
    expect(screen.queryByText(/10:30/)).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <OrderTimeline orderId="123" currentStatus={purchasesStatus.inProgress} className="custom" />,
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders delivered status correctly', () => {
    render(<OrderTimeline orderId="123" currentStatus={purchasesStatus.delivered} />);
    expect(screen.getByText('Đã giao')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
