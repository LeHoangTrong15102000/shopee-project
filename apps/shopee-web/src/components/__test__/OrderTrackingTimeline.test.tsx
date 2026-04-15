import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import OrderTrackingTimeline from '../OrderTrackingTimeline/OrderTrackingTimeline'
import type { OrderTracking } from 'src/types/orderTracking.type'

vi.mock('src/config/orderStatus', async () => {
  const actual =
    await vi.importActual<typeof import('src/config/orderStatus')>('src/config/orderStatus')
  return {
    ...actual,
    getStatusLabel: (status: string) => {
      const labels: Record<string, string> = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        processing: 'Đang xử lý',
        shipping: 'Đang giao',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy',
        returned: 'Đã trả hàng',
      }
      return labels[status] || status
    },
  }
})

vi.mock('src/types/orderTracking.type', async () => {
  const actual = await vi.importActual<typeof import('src/types/orderTracking.type')>(
    'src/types/orderTracking.type',
  )
  return {
    ...actual,
    getCarrierDisplayName: (carrier: string) => {
      const carriers: Record<string, string> = {
        ghn: 'Giao Hàng Nhanh',
        ghtk: 'Giao Hàng Tiết Kiệm',
        viettel_post: 'Viettel Post',
        'j&t': 'J&T Express',
        other: 'Khác',
      }
      return carriers[carrier] || carrier
    },
  }
})

describe('OrderTrackingTimeline', () => {
  const baseTracking: OrderTracking = {
    _id: '123',
    order_id: 'ORD123',
    user_id: 'USER123',
    tracking_number: 'TRK123456',
    carrier: 'ghn',
    status: 'pending',
    estimated_delivery: '2026-03-20T10:00:00.000Z',
    timeline: [
      {
        status: 'pending',
        description: 'Đơn hàng đang chờ xác nhận',
        timestamp: '2026-03-18T08:00:00.000Z',
      },
    ],
    shipping_address: {
      name: 'Test User',
      phone: '0123456789',
      address: '123 Test St',
      province: 'HCM',
      district: 'District 1',
      ward: 'Ward 1',
    },
    createdAt: '2026-03-18T08:00:00.000Z',
    updatedAt: '2026-03-18T08:00:00.000Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering with different order statuses', () => {
    it('renders with pending status', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument()
      expect(screen.getByText('Giao Hàng Nhanh')).toBeInTheDocument()
      expect(screen.getByText('TRK123456')).toBeInTheDocument()
    })

    it('renders with confirmed status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'confirmed',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'confirmed',
            description: 'Đơn hàng đã được xác nhận',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Đã xác nhận')).toBeInTheDocument()
    })

    it('renders with processing status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'processing',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'confirmed',
            description: 'Đơn hàng đã được xác nhận',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
          {
            status: 'processing',
            description: 'Đơn hàng đang được xử lý',
            timestamp: '2026-03-18T10:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Đang xử lý')).toBeInTheDocument()
    })

    it('renders with shipping status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'shipping',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'confirmed',
            description: 'Đơn hàng đã được xác nhận',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
          {
            status: 'processing',
            description: 'Đơn hàng đang được xử lý',
            timestamp: '2026-03-18T10:00:00.000Z',
          },
          {
            status: 'shipping',
            description: 'Đơn hàng đang được giao',
            timestamp: '2026-03-18T11:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Đang giao')).toBeInTheDocument()
    })

    it('renders with delivered status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'delivered',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'confirmed',
            description: 'Đơn hàng đã được xác nhận',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
          {
            status: 'processing',
            description: 'Đơn hàng đang được xử lý',
            timestamp: '2026-03-18T10:00:00.000Z',
          },
          {
            status: 'shipping',
            description: 'Đơn hàng đang được giao',
            timestamp: '2026-03-18T11:00:00.000Z',
          },
          {
            status: 'delivered',
            description: 'Đơn hàng đã được giao thành công',
            timestamp: '2026-03-18T12:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Đã giao')).toBeInTheDocument()
    })

    it('renders with cancelled status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'cancelled',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'cancelled',
            description: 'Đơn hàng đã bị hủy',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Đã hủy')).toBeInTheDocument()
    })

    it('renders with returned status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'returned',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'returned',
            description: 'Đơn hàng đã được trả lại',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Đã trả hàng')).toBeInTheDocument()
    })
  })

  describe('StatusIcon rendering', () => {
    it('renders pending icon', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('renders confirmed icon', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'confirmed',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'confirmed',
            description: 'Đơn hàng đã được xác nhận',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('renders processing icon', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'processing',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'processing',
            description: 'Đơn hàng đang được xử lý',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('renders shipping icon', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'shipping',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'shipping',
            description: 'Đơn hàng đang được giao',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('renders delivered icon', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'delivered',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'delivered',
            description: 'Đơn hàng đã được giao',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('renders cancelled icon', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'cancelled',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'cancelled',
            description: 'Đơn hàng đã bị hủy',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('renders returned icon', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'returned',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'returned',
            description: 'Đơn hàng đã được trả lại',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('Estimated delivery section', () => {
    it('shows estimated delivery for pending status', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText(/Dự kiến giao hàng:/)).toBeInTheDocument()
    })

    it('shows estimated delivery for confirmed status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'confirmed',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'confirmed',
            description: 'Đơn hàng đã được xác nhận',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText(/Dự kiến giao hàng:/)).toBeInTheDocument()
    })

    it('shows estimated delivery for processing status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'processing',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'processing',
            description: 'Đơn hàng đang được xử lý',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText(/Dự kiến giao hàng:/)).toBeInTheDocument()
    })

    it('shows estimated delivery for shipping status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'shipping',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'shipping',
            description: 'Đơn hàng đang được giao',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText(/Dự kiến giao hàng:/)).toBeInTheDocument()
    })

    it('hides estimated delivery for delivered status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'delivered',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'delivered',
            description: 'Đơn hàng đã được giao',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.queryByText(/Dự kiến giao hàng:/)).not.toBeInTheDocument()
    })

    it('hides estimated delivery for cancelled status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'cancelled',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'cancelled',
            description: 'Đơn hàng đã bị hủy',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.queryByText(/Dự kiến giao hàng:/)).not.toBeInTheDocument()
    })

    it('hides estimated delivery for returned status', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'returned',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'returned',
            description: 'Đơn hàng đã được trả lại',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.queryByText(/Dự kiến giao hàng:/)).not.toBeInTheDocument()
    })
  })

  describe('Status messages', () => {
    it('shows delivered message when status is delivered', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'delivered',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'delivered',
            description: 'Đơn hàng đã được giao',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText(/Đơn hàng đã được giao thành công/)).toBeInTheDocument()
    })

    it('shows cancelled message when status is cancelled', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'cancelled',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'cancelled',
            description: 'Đơn hàng đã bị hủy',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getAllByText(/Đơn hàng đã bị hủy/).length).toBeGreaterThan(0)
    })

    it('shows returned message when status is returned', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'returned',
        timeline: [
          ...baseTracking.timeline,
          {
            status: 'returned',
            description: 'Đơn hàng đã được trả lại',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getAllByText(/Đơn hàng đã được trả lại/).length).toBeGreaterThan(0)
    })

    it('does not show delivered message for other statuses', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.queryByText(/Đơn hàng đã được giao thành công/)).not.toBeInTheDocument()
    })

    it('does not show cancelled message for other statuses', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.queryByText(/Đơn hàng đã bị hủy/)).not.toBeInTheDocument()
    })

    it('does not show returned message for other statuses', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.queryByText(/Đơn hàng đã được trả lại/)).not.toBeInTheDocument()
    })
  })

  describe('Timeline events rendering', () => {
    it('renders single timeline event', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Đơn hàng đang chờ xác nhận')).toBeInTheDocument()
    })

    it('renders multiple timeline events', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'shipping',
        timeline: [
          {
            status: 'pending',
            description: 'Đơn hàng đang chờ xác nhận',
            timestamp: '2026-03-18T08:00:00.000Z',
          },
          {
            status: 'confirmed',
            description: 'Đơn hàng đã được xác nhận',
            timestamp: '2026-03-18T09:00:00.000Z',
          },
          {
            status: 'processing',
            description: 'Đơn hàng đang được xử lý',
            timestamp: '2026-03-18T10:00:00.000Z',
          },
          {
            status: 'shipping',
            description: 'Đơn hàng đang được giao',
            timestamp: '2026-03-18T11:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Đơn hàng đang chờ xác nhận')).toBeInTheDocument()
      expect(screen.getByText('Đơn hàng đã được xác nhận')).toBeInTheDocument()
      expect(screen.getByText('Đơn hàng đang được xử lý')).toBeInTheDocument()
      expect(screen.getByText('Đơn hàng đang được giao')).toBeInTheDocument()
    })

    it('renders timeline events with timestamps', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      // Check that timestamp is rendered (formatted date)
      const timestamps = container.querySelectorAll('.text-xs.text-gray-500')
      expect(timestamps.length).toBeGreaterThan(0)
    })
  })

  describe('Location display', () => {
    it('displays location when event has location', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'shipping',
        timeline: [
          {
            status: 'shipping',
            description: 'Đơn hàng đang được giao',
            location: 'Hồ Chí Minh',
            timestamp: '2026-03-18T11:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Hồ Chí Minh')).toBeInTheDocument()
    })

    it('does not display location when event has no location', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      // Check that location icon is not present
      const locationIcons = container.querySelectorAll('.bg-gray-400.dark\\:bg-slate-500')
      expect(locationIcons.length).toBe(0)
    })

    it('displays multiple locations for different events', () => {
      const tracking: OrderTracking = {
        ...baseTracking,
        status: 'shipping',
        timeline: [
          {
            status: 'processing',
            description: 'Đơn hàng đang được xử lý',
            location: 'Hà Nội',
            timestamp: '2026-03-18T10:00:00.000Z',
          },
          {
            status: 'shipping',
            description: 'Đơn hàng đang được giao',
            location: 'Hồ Chí Minh',
            timestamp: '2026-03-18T11:00:00.000Z',
          },
        ],
      }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Hà Nội')).toBeInTheDocument()
      expect(screen.getByText('Hồ Chí Minh')).toBeInTheDocument()
    })
  })

  describe('className prop', () => {
    it('applies custom className to root element', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      const { container } = render(
        <OrderTrackingTimeline tracking={tracking} className="custom-class" />,
      )

      const rootElement = container.firstChild as HTMLElement
      expect(rootElement.className).toContain('custom-class')
    })

    it('preserves default classes when custom className is provided', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      const { container } = render(
        <OrderTrackingTimeline tracking={tracking} className="custom-class" />,
      )

      const rootElement = container.firstChild as HTMLElement
      expect(rootElement.className).toContain('rounded-xl')
      expect(rootElement.className).toContain('bg-white')
      expect(rootElement.className).toContain('custom-class')
    })

    it('renders without custom className', () => {
      const tracking = { ...baseTracking, status: 'pending' as const }
      const { container } = render(<OrderTrackingTimeline tracking={tracking} />)

      const rootElement = container.firstChild as HTMLElement
      expect(rootElement.className).toContain('rounded-xl')
      expect(rootElement.className).toContain('bg-white')
    })
  })

  describe('Carrier display', () => {
    it('displays carrier name for ghn', () => {
      const tracking = { ...baseTracking, carrier: 'ghn' }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Giao Hàng Nhanh')).toBeInTheDocument()
    })

    it('displays carrier name for ghtk', () => {
      const tracking = { ...baseTracking, carrier: 'ghtk' }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Giao Hàng Tiết Kiệm')).toBeInTheDocument()
    })

    it('displays carrier name for viettel_post', () => {
      const tracking = { ...baseTracking, carrier: 'viettel_post' }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('Viettel Post')).toBeInTheDocument()
    })

    it('displays carrier name for j&t', () => {
      const tracking = { ...baseTracking, carrier: 'j&t' }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('J&T Express')).toBeInTheDocument()
    })
  })

  describe('Tracking number display', () => {
    it('displays tracking number', () => {
      const tracking = { ...baseTracking, tracking_number: 'TRK999888' }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText('TRK999888')).toBeInTheDocument()
    })

    it('displays tracking number label', () => {
      const tracking = { ...baseTracking }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText(/Mã vận đơn:/)).toBeInTheDocument()
    })
  })

  describe('Last updated timestamp', () => {
    it('displays last updated timestamp', () => {
      const tracking = { ...baseTracking }
      render(<OrderTrackingTimeline tracking={tracking} />)

      expect(screen.getByText(/Cập nhật lần cuối:/)).toBeInTheDocument()
    })
  })
})
