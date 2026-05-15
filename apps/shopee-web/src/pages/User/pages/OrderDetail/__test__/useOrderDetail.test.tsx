import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOrderDetail } from '../useOrderDetail'
import { toast } from 'react-toastify'
import orderApi from 'src/apis/order.api'
import orderTrackingApi from 'src/apis/orderTracking.api'

const mockUseParams = vi.fn()
const mockUseSearchParams = vi.fn()
const mockUseNavigate = vi.fn()
const mockUseOrderTracking = vi.fn()

vi.mock('react-router', () => ({
  useParams: () => mockUseParams(),
  useSearchParams: () => mockUseSearchParams(),
  useNavigate: () => mockUseNavigate(),
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('src/apis/order.api', () => ({
  default: {
    getOrderById: vi.fn(),
    cancelOrder: vi.fn(),
    returnOrder: vi.fn(),
  },
}))

vi.mock('src/apis/orderTracking.api', () => ({
  default: {
    getTracking: vi.fn(),
  },
}))

vi.mock('src/hooks/useOrderTracking', () => ({
  default: () => mockUseOrderTracking(),
}))

vi.mock('src/constant/order', () => ({
  orderStatusFromNumber: vi.fn((num) => {
    const map: Record<number, string> = {
      1: 'pending',
      2: 'processing',
      3: 'shipped',
      4: 'delivered',
      5: 'cancelled',
    }
    return map[num]
  }),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useOrderDetail', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ orderId: 'order123' })
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()])
    mockUseNavigate.mockReturnValue(mockNavigate)
    mockUseOrderTracking.mockReturnValue({
      currentStatus: null,
      isSubscribed: false,
      statusHistory: [],
    })
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    expect(result.current.orderId).toBe('order123')
    expect(result.current.showCancelModal).toBe(false)
    expect(result.current.cancelReason).toBe('')
    expect(result.current.showReturnModal).toBe(false)
    expect(result.current.returnReason).toBe('')
    expect(result.current.returnReasonError).toBe('')
  })

  it('should fetch order data', async () => {
    const mockOrder = {
      data: {
        data: {
          _id: 'order123',
          status: 'pending',
          total: 100000,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
    }
    vi.mocked(orderApi.getOrderById).mockResolvedValue(mockOrder as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.order).toEqual(mockOrder.data.data)
    })
  })

  it('should fetch tracking data with status from URL', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams('status=2'), vi.fn()])

    const mockTracking = {
      data: {
        data: {
          timeline: [
            { status: 'pending', timestamp: '2024-01-01T00:00:00Z' },
            { status: 'processing', timestamp: '2024-01-02T00:00:00Z' },
          ],
        },
      },
    }
    vi.mocked(orderTrackingApi.getTracking).mockResolvedValue(mockTracking as any)
    vi.mocked(orderApi.getOrderById).mockResolvedValue({
      data: { data: { status: 'processing', createdAt: '2024-01-01T00:00:00Z' } },
    } as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(orderTrackingApi.getTracking).toHaveBeenCalledWith({
        order_id: 'order123',
        status: 'processing',
      })
    })

    await waitFor(() => {
      expect(result.current.tracking).toEqual(mockTracking.data.data)
    })
  })

  it('should build stepTimestamps from tracking timeline', async () => {
    const mockOrder = {
      data: {
        data: {
          _id: 'order123',
          status: 'processing',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z',
        },
      },
    }
    const mockTracking = {
      data: {
        data: {
          timeline: [
            { status: 'pending', timestamp: '2024-01-01T00:00:00Z' },
            { status: 'processing', timestamp: '2024-01-02T00:00:00Z' },
          ],
        },
      },
    }

    vi.mocked(orderApi.getOrderById).mockResolvedValue(mockOrder as any)
    vi.mocked(orderTrackingApi.getTracking).mockResolvedValue(mockTracking as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.stepTimestamps).toEqual({
        pending: '2024-01-01T00:00:00Z',
        processing: '2024-01-02T00:00:00Z',
      })
    })
  })

  it('should merge websocket statusHistory into stepTimestamps', async () => {
    const mockOrder = {
      data: { data: { _id: 'order123', status: 'shipped', createdAt: '2024-01-01T00:00:00Z' } },
    }
    const mockTracking = {
      data: {
        data: {
          timeline: [{ status: 'pending', timestamp: '2024-01-01T00:00:00Z' }],
        },
      },
    }

    vi.mocked(orderApi.getOrderById).mockResolvedValue(mockOrder as any)
    vi.mocked(orderTrackingApi.getTracking).mockResolvedValue(mockTracking as any)

    mockUseOrderTracking.mockReturnValue({
      currentStatus: 'shipped',
      isSubscribed: true,
      statusHistory: [
        { status: 'processing', updated_at: '2024-01-02T00:00:00Z' },
        { status: 'shipped', updated_at: '2024-01-03T00:00:00Z' },
      ],
    })

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.stepTimestamps).toEqual({
        pending: '2024-01-01T00:00:00Z',
        processing: '2024-01-02T00:00:00Z',
        shipped: '2024-01-03T00:00:00Z',
      })
    })
  })

  it('should add delivered timestamp from order.updatedAt if status is delivered', async () => {
    const mockOrder = {
      data: {
        data: {
          _id: 'order123',
          status: 'delivered',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-05T00:00:00Z',
        },
      },
    }
    const mockTracking = {
      data: { data: { timeline: [] } },
    }

    vi.mocked(orderApi.getOrderById).mockResolvedValue(mockOrder as any)
    vi.mocked(orderTrackingApi.getTracking).mockResolvedValue(mockTracking as any)

    mockUseOrderTracking.mockReturnValue({
      currentStatus: 'delivered',
      isSubscribed: true,
      statusHistory: [],
    })

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.stepTimestamps.delivered).toBe('2024-01-05T00:00:00Z')
    })
  })

  it('should handle cancel order successfully', async () => {
    vi.mocked(orderApi.cancelOrder).mockResolvedValue({ data: { success: true } } as any)
    vi.mocked(orderApi.getOrderById).mockResolvedValue({
      data: { data: { _id: 'order123', createdAt: '2024-01-01T00:00:00Z' } },
    } as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setCancelReason('Changed my mind')
      result.current.setShowCancelModal(true)
    })

    act(() => {
      result.current.handleCancelOrder()
    })

    await waitFor(() => {
      expect(orderApi.cancelOrder).toHaveBeenCalledWith('order123', 'Changed my mind')
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Hủy đơn hàng thành công')
      expect(result.current.showCancelModal).toBe(false)
    })
  })

  it('should handle cancel order error', async () => {
    vi.mocked(orderApi.cancelOrder).mockRejectedValue(new Error('Network error'))
    vi.mocked(orderApi.getOrderById).mockResolvedValue({
      data: { data: { _id: 'order123', createdAt: '2024-01-01T00:00:00Z' } },
    } as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setCancelReason('Changed my mind')
    })

    act(() => {
      result.current.handleCancelOrder()
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Hủy đơn hàng thất bại')
    })
  })

  it('should handle return order successfully', async () => {
    vi.mocked(orderApi.returnOrder).mockResolvedValue({ data: { success: true } } as any)
    vi.mocked(orderApi.getOrderById).mockResolvedValue({
      data: { data: { _id: 'order123', createdAt: '2024-01-01T00:00:00Z' } },
    } as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setReturnReason('Product defective')
      result.current.setShowReturnModal(true)
    })

    act(() => {
      result.current.handleReturnOrder()
    })

    await waitFor(() => {
      expect(orderApi.returnOrder).toHaveBeenCalledWith('order123', 'Product defective')
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Yêu cầu trả hàng thành công')
      expect(result.current.showReturnModal).toBe(false)
      expect(result.current.returnReason).toBe('')
      expect(result.current.returnReasonError).toBe('')
    })
  })

  it('should validate return reason before submitting', () => {
    vi.mocked(orderApi.getOrderById).mockResolvedValue({
      data: { data: { _id: 'order123', createdAt: '2024-01-01T00:00:00Z' } },
    } as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setReturnReason('   ')
      result.current.handleReturnOrder()
    })

    expect(result.current.returnReasonError).toBe('Vui lòng nhập lý do trả hàng')
    expect(orderApi.returnOrder).not.toHaveBeenCalled()
  })

  it('should clear return reason error on successful submission', async () => {
    vi.mocked(orderApi.returnOrder).mockResolvedValue({ data: { success: true } } as any)
    vi.mocked(orderApi.getOrderById).mockResolvedValue({
      data: { data: { _id: 'order123', createdAt: '2024-01-01T00:00:00Z' } },
    } as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setReturnReasonError('Previous error')
      result.current.setReturnReason('Valid reason')
    })

    act(() => {
      result.current.handleReturnOrder()
    })

    await waitFor(() => {
      expect(result.current.returnReasonError).toBe('')
    })
  })

  it('should handle return order error', async () => {
    vi.mocked(orderApi.returnOrder).mockRejectedValue(new Error('Network error'))
    vi.mocked(orderApi.getOrderById).mockResolvedValue({
      data: { data: { _id: 'order123', createdAt: '2024-01-01T00:00:00Z' } },
    } as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setReturnReason('Product defective')
    })

    act(() => {
      result.current.handleReturnOrder()
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Yêu cầu trả hàng thất bại')
    })
  })

  it('should expose currentStatus from websocket', () => {
    mockUseOrderTracking.mockReturnValue({
      currentStatus: 'shipped',
      isSubscribed: true,
      statusHistory: [],
    })

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    expect(result.current.currentStatus).toBe('shipped')
    expect(result.current.isSubscribed).toBe(true)
  })

  it('should handle missing orderId', () => {
    mockUseParams.mockReturnValue({})

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    expect(result.current.orderId).toBeUndefined()
    expect(orderApi.getOrderById).not.toHaveBeenCalled()
  })

  it('should update modal states correctly', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setShowCancelModal(true)
    })
    expect(result.current.showCancelModal).toBe(true)

    act(() => {
      result.current.setShowCancelModal(false)
    })
    expect(result.current.showCancelModal).toBe(false)

    act(() => {
      result.current.setShowReturnModal(true)
    })
    expect(result.current.showReturnModal).toBe(true)

    act(() => {
      result.current.setShowReturnModal(false)
    })
    expect(result.current.showReturnModal).toBe(false)
  })

  it('should update reason states correctly', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setCancelReason('Test cancel reason')
    })
    expect(result.current.cancelReason).toBe('Test cancel reason')

    act(() => {
      result.current.setReturnReason('Test return reason')
    })
    expect(result.current.returnReason).toBe('Test return reason')

    act(() => {
      result.current.setReturnReasonError('Test error')
    })
    expect(result.current.returnReasonError).toBe('Test error')
  })

  it('should use order status when currentStatus is null', async () => {
    const mockOrder = {
      data: {
        data: {
          _id: 'order123',
          status: 'processing',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z',
        },
      },
    }
    const mockTracking = {
      data: { data: { timeline: [] } },
    }

    vi.mocked(orderApi.getOrderById).mockResolvedValue(mockOrder as any)
    vi.mocked(orderTrackingApi.getTracking).mockResolvedValue(mockTracking as any)

    mockUseOrderTracking.mockReturnValue({
      currentStatus: null,
      isSubscribed: false,
      statusHistory: [],
    })

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.order?.status).toBe('processing')
    })
  })

  it('should not call cancelOrder when orderId is undefined', () => {
    mockUseParams.mockReturnValue({})

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setCancelReason('Some reason')
      result.current.handleCancelOrder()
    })

    expect(orderApi.cancelOrder).not.toHaveBeenCalled()
  })

  it('should not call returnOrder when orderId is undefined', () => {
    mockUseParams.mockReturnValue({})

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    act(() => {
      result.current.setReturnReason('Valid reason')
      result.current.handleReturnOrder()
    })

    expect(orderApi.returnOrder).not.toHaveBeenCalled()
  })

  it('should invalidate queries after successful cancel', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(orderApi.cancelOrder).mockResolvedValue({ data: { success: true } } as any)
    vi.mocked(orderApi.getOrderById).mockResolvedValue({
      data: { data: { _id: 'order123', createdAt: '2024-01-01T00:00:00Z' } },
    } as any)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useOrderDetail(), { wrapper })

    act(() => {
      result.current.setCancelReason('Changed my mind')
      result.current.handleCancelOrder()
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['order', 'order123'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders'] })
    })
  })

  it('should invalidate queries after successful return', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    vi.mocked(orderApi.returnOrder).mockResolvedValue({ data: { success: true } } as any)
    vi.mocked(orderApi.getOrderById).mockResolvedValue({
      data: { data: { _id: 'order123', createdAt: '2024-01-01T00:00:00Z' } },
    } as any)

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const { result } = renderHook(() => useOrderDetail(), { wrapper })

    act(() => {
      result.current.setReturnReason('Product defective')
    })

    act(() => {
      result.current.handleReturnOrder()
    })

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['order', 'order123'] })
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders'] })
    })
  })

  it('should not add delivered timestamp if already exists in timeline', async () => {
    const mockOrder = {
      data: {
        data: {
          _id: 'order123',
          status: 'delivered',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-05T00:00:00Z',
        },
      },
    }
    const mockTracking = {
      data: {
        data: {
          timeline: [{ status: 'delivered', timestamp: '2024-01-04T00:00:00Z' }],
        },
      },
    }

    vi.mocked(orderApi.getOrderById).mockResolvedValue(mockOrder as any)
    vi.mocked(orderTrackingApi.getTracking).mockResolvedValue(mockTracking as any)

    mockUseOrderTracking.mockReturnValue({
      currentStatus: 'delivered',
      isSubscribed: true,
      statusHistory: [],
    })

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.stepTimestamps.delivered).toBe('2024-01-04T00:00:00Z')
    })
  })

  it('should handle empty tracking timeline', async () => {
    const mockOrder = {
      data: {
        data: {
          _id: 'order123',
          status: 'pending',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
    }
    const mockTracking = {
      data: { data: {} },
    }

    vi.mocked(orderApi.getOrderById).mockResolvedValue(mockOrder as any)
    vi.mocked(orderTrackingApi.getTracking).mockResolvedValue(mockTracking as any)

    mockUseOrderTracking.mockReturnValue({
      currentStatus: null,
      isSubscribed: false,
      statusHistory: [],
    })

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.stepTimestamps).toEqual({})
    })
  })

  it('should expose navigate function', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    expect(result.current.navigate).toBe(mockNavigate)
  })

  it('should expose mutation objects', () => {
    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    expect(result.current.cancelMutation).toBeDefined()
    expect(result.current.returnMutation).toBeDefined()
    expect(typeof result.current.cancelMutation.mutate).toBe('function')
    expect(typeof result.current.returnMutation.mutate).toBe('function')
  })

  it('should handle tracking query with order status when no statusString', async () => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(), vi.fn()])

    const mockOrder = {
      data: {
        data: {
          _id: 'order123',
          status: 'confirmed',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      },
    }
    const mockTracking = {
      data: {
        data: {
          timeline: [{ status: 'confirmed', timestamp: '2024-01-02T00:00:00Z' }],
        },
      },
    }

    vi.mocked(orderApi.getOrderById).mockResolvedValue(mockOrder as any)
    vi.mocked(orderTrackingApi.getTracking).mockResolvedValue(mockTracking as any)

    const { result } = renderHook(() => useOrderDetail(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.order).toBeDefined()
    })

    await waitFor(() => {
      expect(orderTrackingApi.getTracking).toHaveBeenCalledWith({
        order_id: 'order123',
        status: 'confirmed',
      })
    })
  })
})
