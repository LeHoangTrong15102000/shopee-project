import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoucherListModal from '../VoucherListModal'
import { renderWithProviders } from 'src/utils/testUtils'

// Mock voucher API
vi.mock('src/apis/voucher.api', () => ({
  default: {
    getAvailableVouchers: vi.fn().mockResolvedValue({
      data: {
        data: {
          vouchers: [
            {
              _id: 'v1',
              code: 'GIAM50K',
              name: 'Giảm 50K',
              description: 'Giảm 50.000đ',
              discount_type: 'fixed_amount',
              discount_value: 50000,
              min_order_value: 200000,
              end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
              is_active: true,
              is_collected: false,
            },
            {
              _id: 'v2',
              code: 'SALE10',
              name: 'Giảm 10%',
              description: 'Giảm 10%',
              discount_type: 'percentage',
              discount_value: 10,
              min_order_value: 100000,
              max_discount: 100000,
              end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
              is_active: true,
              is_collected: true,
            },
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
        },
      },
    }),
    saveVoucher: vi.fn().mockResolvedValue({ data: { message: 'OK' } }),
  },
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('VoucherListModal (Task 2.13)', () => {
  const onClose = vi.fn()
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal with title when open', async () => {
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByText('Mã Giảm Giá Của Shop')).toBeInTheDocument()
    })
  })

  it('does not render content when closed', () => {
    renderWithProviders(<VoucherListModal isOpen={false} onClose={onClose} />)
    expect(screen.queryByText('Mã Giảm Giá Của Shop')).not.toBeInTheDocument()
  })

  it('shows loading skeletons initially', () => {
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    // 6 skeleton cards rendered inside the grid container
    const grid = document.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    const skeletonCards = grid!.querySelectorAll(':scope > .animate-pulse')
    expect(skeletonCards).toHaveLength(6)
  })

  it('displays voucher cards after loading', async () => {
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByText('Giảm 50K')).toBeInTheDocument()
      // 'Giảm 10%' appears in both name and description, so use getAllByText
      expect(screen.getAllByText('Giảm 10%').length).toBeGreaterThan(0)
    })
  })

  it('calls onClose when close button is clicked', async () => {
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByText('Mã Giảm Giá Của Shop')).toBeInTheDocument()
    })
    const closeBtn = screen.getByLabelText('Đóng')
    await user.click(closeBtn)
    expect(onClose).toHaveBeenCalled()
  })

  it('saves voucher with optimistic update', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    const { toast } = await import('react-toastify')
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByText('Giảm 50K')).toBeInTheDocument()
    })
    const saveButtons = screen.getAllByText('Lưu')
    expect(saveButtons.length).toBeGreaterThan(0)
    await user.click(saveButtons[0])
    expect(voucherApi.saveVoucher).toHaveBeenCalledWith('v1')
    // Post-conditions: success toast, button text changes, button disabled
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled()
    })
    // After optimistic update, button should show "Đã lưu" and be disabled
    await waitFor(() => {
      const savedButtons = screen.getAllByText('Đã lưu')
      expect(savedButtons.length).toBeGreaterThanOrEqual(2) // v1 (just saved) + v2 (already saved)
      // The first voucher's button should now be disabled
      const v1Button = savedButtons[0].closest('button')
      expect(v1Button).toBeDisabled()
    })
  })

  it('shows "Đã lưu" disabled button for already-saved voucher', async () => {
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getAllByText('Giảm 10%').length).toBeGreaterThan(0)
    })
    // v2 has is_collected: true, so it should show "Đã lưu"
    const savedButtons = screen.getAllByText('Đã lưu')
    expect(savedButtons.length).toBeGreaterThan(0)
    expect(savedButtons[0].closest('button')).toBeDisabled()
  })

  it('shows error toast when save voucher fails', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    const { toast } = await import('react-toastify')
    ;(voucherApi.saveVoucher as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('fail'))
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByText('Giảm 50K')).toBeInTheDocument()
    })
    const saveButtons = screen.getAllByText('Lưu')
    expect(saveButtons.length).toBeGreaterThan(0)
    await user.click(saveButtons[0])
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('has accessible modal structure', async () => {
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('shows responsive grid layout', async () => {
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByText('Giảm 50K')).toBeInTheDocument()
    })
    const grid = document.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(grid?.classList.contains('grid-cols-1')).toBe(true)
    expect(grid?.classList.contains('sm:grid-cols-2')).toBe(true)
    expect(grid?.classList.contains('lg:grid-cols-3')).toBe(true)
  })
})

describe('VoucherListModal - Error & Empty States', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays empty state when no vouchers available', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    ;(voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { data: { vouchers: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } },
    })
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByText('Không có voucher khả dụng')).toBeInTheDocument()
    })
  })

  it('displays error state with retry button on API failure', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    ;(voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    )
    renderWithProviders(<VoucherListModal isOpen={true} onClose={onClose} />)
    await waitFor(() => {
      expect(screen.getByText('Không thể tải voucher. Vui lòng thử lại.')).toBeInTheDocument()
    })
    expect(screen.getByText('Thử lại')).toBeInTheDocument()
  })
})
