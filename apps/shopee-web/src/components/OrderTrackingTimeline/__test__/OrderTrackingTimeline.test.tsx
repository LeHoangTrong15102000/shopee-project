import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderTrackingTimeline from '../OrderTrackingTimeline';

vi.mock('src/config/orderStatus', () => ({
  getStatusLabel: (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Chờ xác nhận',
      confirmed: 'Đã xác nhận',
      processing: 'Đang xử lý',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
      returned: 'Đã trả hàng',
    };
    return labels[status] || status;
  },
}));

vi.mock('src/types/orderTracking.type', () => ({
  getCarrierDisplayName: (code: string) => {
    const names: Record<string, string> = { ghn: 'Giao Hàng Nhanh', ghtk: 'Giao Hàng Tiết Kiệm' };
    return names[code] || code;
  },
}));

const baseTracking = {
  _id: 'track-1',
  orderId: 'order-1',
  carrier: 'ghn',
  tracking_number: 'GHN123456',
  status: 'shipping' as const,
  estimated_delivery: '2026-03-25T10:00:00Z',
  updatedAt: '2026-03-19T08:00:00Z',
  timeline: [
    { status: 'pending', description: 'Đơn hàng đã được tạo', timestamp: '2026-03-17T10:00:00Z' },
    { status: 'confirmed', description: 'Đã xác nhận', timestamp: '2026-03-17T12:00:00Z' },
    { status: 'processing', description: 'Đang đóng gói', timestamp: '2026-03-18T08:00:00Z' },
    {
      status: 'shipping',
      description: 'Đang vận chuyển',
      timestamp: '2026-03-19T06:00:00Z',
      location: 'Hà Nội',
    },
  ],
};

describe('OrderTrackingTimeline', () => {
  it('renders carrier name and tracking number', () => {
    render(<OrderTrackingTimeline tracking={baseTracking as any} />);
    expect(screen.getByText('Giao Hàng Nhanh')).toBeInTheDocument();
    expect(screen.getByText('GHN123456')).toBeInTheDocument();
  });

  it('renders estimated delivery for shipping status', () => {
    render(<OrderTrackingTimeline tracking={baseTracking as any} />);
    expect(screen.getByText(/Dự kiến giao hàng/)).toBeInTheDocument();
  });

  it('renders timeline events', () => {
    render(<OrderTrackingTimeline tracking={baseTracking as any} />);
    expect(screen.getByText('Đơn hàng đã được tạo')).toBeInTheDocument();
    expect(screen.getByText('Đang vận chuyển')).toBeInTheDocument();
  });

  it('renders location when present', () => {
    render(<OrderTrackingTimeline tracking={baseTracking as any} />);
    expect(screen.getByText('Hà Nội')).toBeInTheDocument();
  });

  it('renders last updated timestamp', () => {
    render(<OrderTrackingTimeline tracking={baseTracking as any} />);
    expect(screen.getByText(/Cập nhật lần cuối/)).toBeInTheDocument();
  });

  it('shows delivered success message', () => {
    const delivered = {
      ...baseTracking,
      status: 'delivered' as const,
      timeline: [
        ...baseTracking.timeline,
        {
          status: 'delivered',
          description: 'Đã giao thành công',
          timestamp: '2026-03-20T10:00:00Z',
        },
      ],
    };
    render(<OrderTrackingTimeline tracking={delivered as any} />);
    expect(screen.getByText(/Đơn hàng đã được giao thành công/)).toBeInTheDocument();
  });

  it('shows cancelled message', () => {
    const cancelled = {
      ...baseTracking,
      status: 'cancelled' as const,
      timeline: [
        { status: 'pending', description: 'Đã tạo', timestamp: '2026-03-17T10:00:00Z' },
        { status: 'cancelled', description: 'Đã hủy', timestamp: '2026-03-18T10:00:00Z' },
      ],
    };
    render(<OrderTrackingTimeline tracking={cancelled as any} />);
    expect(screen.getByText(/Đơn hàng đã bị hủy/)).toBeInTheDocument();
  });

  it('shows returned message', () => {
    const returned = {
      ...baseTracking,
      status: 'returned' as const,
      timeline: [
        { status: 'pending', description: 'Đã tạo', timestamp: '2026-03-17T10:00:00Z' },
        { status: 'returned', description: 'Đã trả', timestamp: '2026-03-18T10:00:00Z' },
      ],
    };
    render(<OrderTrackingTimeline tracking={returned as any} />);
    expect(screen.getByText(/Đơn hàng đã được trả lại/)).toBeInTheDocument();
  });

  it('hides estimated delivery for delivered status', () => {
    const delivered = {
      ...baseTracking,
      status: 'delivered' as const,
      timeline: baseTracking.timeline,
    };
    render(<OrderTrackingTimeline tracking={delivered as any} />);
    expect(screen.queryByText(/Dự kiến giao hàng/)).toBeNull();
  });

  it('hides estimated delivery for cancelled status', () => {
    const cancelled = {
      ...baseTracking,
      status: 'cancelled' as const,
      timeline: [{ status: 'cancelled', description: 'Hủy', timestamp: '2026-03-18T10:00:00Z' }],
    };
    render(<OrderTrackingTimeline tracking={cancelled as any} />);
    expect(screen.queryByText(/Dự kiến giao hàng/)).toBeNull();
  });

  it('renders status header', () => {
    render(<OrderTrackingTimeline tracking={baseTracking as any} />);
    expect(screen.getByText('Trạng thái đơn hàng')).toBeInTheDocument();
  });

  it('renders tracking number label', () => {
    render(<OrderTrackingTimeline tracking={baseTracking as any} />);
    expect(screen.getByText(/Mã vận đơn/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <OrderTrackingTimeline tracking={baseTracking as any} className="custom" />,
    );
    expect(container.firstChild).toHaveClass('custom');
  });

  it('renders pending status timeline', () => {
    const pending = {
      ...baseTracking,
      status: 'pending' as const,
      timeline: [
        { status: 'pending', description: 'Đang chờ xác nhận', timestamp: '2026-03-17T10:00:00Z' },
      ],
    };
    render(<OrderTrackingTimeline tracking={pending as any} />);
    expect(screen.getByText('Đang chờ xác nhận')).toBeInTheDocument();
  });
});
