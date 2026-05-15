import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VoucherRow from '../VoucherRow'
import { renderWithProviders } from 'src/utils/testUtils'

// Mock framer-motion so AnimatePresence/motion.div render synchronously
// Override FloatingPortal to render inline for testing (avoids portal isolation in jsdom)
vi.mock('@floating-ui/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@floating-ui/react')>()
  return {
    ...actual,
    FloatingPortal: ({ children }: any) => <div data-testid="portal">{children}</div>,
  }
})

const defaultVouchers = [
  {
    _id: 'v1',
    code: 'GIAM50K',
    name: 'Giảm 50K',
    description: 'Giảm 50K',
    discount_type: 'fixed_amount',
    discount_value: 50000,
    min_order_value: 200000,
    end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    is_active: true,
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
  },
  {
    _id: 'v3',
    code: 'FREESHIP',
    name: 'Free Ship',
    description: 'Free Ship',
    discount_type: 'shipping',
    discount_value: 30000,
    min_order_value: 0,
    end_date: new Date(Date.now() + 14 * 86400000).toISOString(),
    is_active: true,
  },
  {
    _id: 'v4',
    code: 'EXTRA',
    name: 'Extra',
    description: 'Extra',
    discount_type: 'fixed_amount',
    discount_value: 20000,
    min_order_value: 99000,
    end_date: new Date(Date.now() + 5 * 86400000).toISOString(),
    is_active: true,
  },
]

const defaultResponse = {
  data: {
    data: {
      vouchers: defaultVouchers,
      pagination: { page: 1, limit: 10, total: 4, totalPages: 1 },
    },
  },
}

vi.mock('src/apis/voucher.api', () => ({
  default: {
    getAvailableVouchers: vi.fn(),
    saveVoucher: vi.fn(),
  },
}))

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('VoucherRow (Task 3.10)', () => {
  const user = userEvent.setup()

  beforeEach(async () => {
    vi.clearAllMocks()
    // Re-establish default mocks so every test starts clean
    const voucherApi = (await import('src/apis/voucher.api')).default
    ;(voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockResolvedValue(
      defaultResponse,
    )
    ;(voucherApi.saveVoucher as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { message: 'OK' },
    })
  })

  it('renders voucher row with label', () => {
    renderWithProviders(<VoucherRow />)
    expect(screen.getByText('Mã Giảm Giá Của Shop')).toBeInTheDocument()
  })

  it('shows loading skeletons while fetching', () => {
    renderWithProviders(<VoucherRow />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays first 3 voucher badges after loading', async () => {
    renderWithProviders(<VoucherRow />)
    await waitFor(() => {
      const badges = document.querySelectorAll('[style*="clip-path"]')
      expect(badges.length).toBe(3)
    })
  })

  it('shows "see more" when more than 3 vouchers', async () => {
    renderWithProviders(<VoucherRow />)
    await waitFor(() => {
      expect(screen.getByText('Xem thêm')).toBeInTheDocument()
    })
  })

  it('shows popover on hover', async () => {
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    await user.hover(row)
    await waitFor(() => {
      // Popover opens — popup header duplicates the title, so check for 2 instances
      const titles = screen.getAllByText('Mã Giảm Giá Của Shop')
      expect(titles.length).toBe(2) // row label + popup header
    })
  })

  it('has proper ARIA attributes', () => {
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    expect(row).toHaveAttribute('tabindex', '0')
    expect(row).toHaveAttribute('role', 'button')
  })

  it('has cursor-pointer and hover styles', () => {
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    // CSS classes are on the inner content div (first child of Popover wrapper)
    const innerDiv = row.firstElementChild!
    expect(innerDiv.classList.contains('cursor-pointer')).toBe(true)
    expect(innerDiv.classList.contains('hover:bg-gray-50')).toBe(true)
  })

  it('does not show "see more" when 3 or fewer vouchers', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    ;(voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        data: {
          vouchers: [
            {
              _id: 'v1',
              code: 'GIAM50K',
              name: 'Giảm 50K',
              description: 'Giảm 50K',
              discount_type: 'fixed_amount',
              discount_value: 50000,
              min_order_value: 200000,
              end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
              is_active: true,
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
            },
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
        },
      },
    })
    renderWithProviders(<VoucherRow />)
    await waitFor(() => {
      expect(document.querySelectorAll('[style*="clip-path"]').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('Xem thêm')).not.toBeInTheDocument()
  })

  it('popover trigger has aria-haspopup attribute', () => {
    renderWithProviders(<VoucherRow />)
    // Popover wrapper adds aria-haspopup="dialog"
    const popoverTrigger = document.querySelector('[aria-haspopup="dialog"]')
    expect(popoverTrigger).toBeInTheDocument()
  })

  it('opens popover on Enter key', async () => {
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    row.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => {
      const titles = screen.getAllByText('Mã Giảm Giá Của Shop')
      expect(titles.length).toBe(2)
    })
  })

  it('closes popover on Escape', async () => {
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    await user.hover(row)
    await waitFor(() => {
      expect(screen.getAllByText('Mã Giảm Giá Của Shop').length).toBe(2)
    })
    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.getAllByText('Mã Giảm Giá Của Shop').length).toBe(1)
    })
  })

  it('closes popover on mouse leave', async () => {
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    await user.hover(row)
    await waitFor(() => {
      expect(screen.getAllByText('Mã Giảm Giá Của Shop').length).toBe(2)
    })
    await user.unhover(row)
    await waitFor(() => {
      expect(screen.getAllByText('Mã Giảm Giá Của Shop').length).toBe(1)
    })
  })

  it('sets aria-expanded to true when popover opens', async () => {
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    expect(row).toHaveAttribute('aria-expanded', 'false')
    await user.hover(row)
    await waitFor(() => {
      expect(row).toHaveAttribute('aria-expanded', 'true')
    })
  })

  // --- Save voucher flow tests (spec: Save voucher from popover) ---

  it('saves voucher on button click and shows saved state', async () => {
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    // Wait for vouchers to load
    await waitFor(() => {
      expect(screen.queryByText('₫50.000')).toBeInTheDocument()
    })
    // Open popover
    await user.hover(row)
    // Find the popover floating content by its id prefix (avoids ambiguity with inner region)
    const popover = await waitFor(() => {
      const el = document.querySelector('[id^="popover-content-"]') as HTMLElement
      expect(el).toBeTruthy()
      return el
    })
    // Find and click the first save button inside the popup
    const saveButtons = await within(popover).findAllByText('Lưu')
    await user.click(saveButtons[0])
    // Verify API was called
    const voucherApi = (await import('src/apis/voucher.api')).default
    expect(voucherApi.saveVoucher).toHaveBeenCalledWith('v1')
    // Optimistic update: button should show "Đã lưu"
    await waitFor(() => {
      expect(within(popover).getByText('Đã lưu')).toBeInTheDocument()
    })
    // Verify success toast was shown
    const { toast } = await import('react-toastify')
    expect(toast.success).toHaveBeenCalled()
  })

  it('rolls back on save failure', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    ;(voucherApi.saveVoucher as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Save failed'),
    )
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    await waitFor(() => {
      expect(screen.queryByText('₫50.000')).toBeInTheDocument()
    })
    await user.hover(row)
    const popover = await waitFor(() => {
      const el = document.querySelector('[id^="popover-content-"]') as HTMLElement
      expect(el).toBeTruthy()
      return el
    })
    const saveButtons = await within(popover).findAllByText('Lưu')
    await user.click(saveButtons[0])
    // After failure, button should revert to "Lưu" (rollback)
    await waitFor(() => {
      const allSaveButtons = within(popover).getAllByText('Lưu')
      expect(allSaveButtons.length).toBeGreaterThan(0)
    })
    // Verify error toast was shown
    const { toast } = await import('react-toastify')
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled()
    })
  })

  it('shows already-saved voucher as disabled', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    ;(voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        data: {
          vouchers: [
            {
              _id: 'v1',
              code: 'GIAM50K',
              name: 'Giảm 50K',
              description: 'Giảm 50K',
              discount_type: 'fixed_amount',
              discount_value: 50000,
              min_order_value: 200000,
              end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
              is_active: true,
              is_collected: true,
            },
          ],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      },
    })
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    await waitFor(() => {
      expect(screen.queryByText('₫50.000')).toBeInTheDocument()
    })
    await user.hover(row)
    const popover = await waitFor(() => {
      const el = document.querySelector('[id^="popover-content-"]') as HTMLElement
      expect(el).toBeTruthy()
      return el
    })
    // Already saved voucher should show "Đã lưu" and be disabled
    await waitFor(() => {
      const savedButton = within(popover).getByText('Đã lưu')
      expect(savedButton.closest('button')).toBeDisabled()
    })
  })

  // --- Empty state test (spec: No vouchers available) ---

  it('shows empty state in popup when no vouchers', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    ;(voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        data: {
          vouchers: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        },
      },
    })
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    await user.hover(row)
    await waitFor(() => {
      expect(screen.getByText('Không có voucher khả dụng')).toBeInTheDocument()
    })
  })

  // --- Error state with retry test ---

  it('shows error state with retry button in popup', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    ;(voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error'),
    )
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    await user.hover(row)
    await waitFor(() => {
      expect(screen.getByText('Không thể tải voucher. Vui lòng thử lại.')).toBeInTheDocument()
    })
    // Retry button should be present
    const retryButton = screen.getByText('Thử lại')
    expect(retryButton).toBeInTheDocument()
    // Click retry should call API again
    await user.click(retryButton)
    // VoucherRow passes voucherData to VoucherPopupContent (shared hook),
    // so the API is called once initially + once on retry = 2 times
    expect(voucherApi.getAvailableVouchers).toHaveBeenCalledTimes(2)
  })

  // --- Exactly 3 vouchers boundary test ---

  it('shows exactly 3 badges without "see more" for 3 vouchers', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    ;(voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: {
        data: {
          vouchers: defaultVouchers.slice(0, 3),
          pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
        },
      },
    })
    renderWithProviders(<VoucherRow />)
    await waitFor(() => {
      expect(document.querySelectorAll('[style*="clip-path"]').length).toBeGreaterThan(0)
    })
    expect(screen.queryByText('Xem thêm')).not.toBeInTheDocument()
  })

  // --- Scrollable overflow / max-height test (spec: max-height ~400px) ---

  it('has max-height and overflow-y-auto on scrollable container inside popover', async () => {
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    await user.hover(row)
    // Wait for popover to open, then find the inner scrollable region (not the popover wrapper)
    await waitFor(() => {
      const popover = document.querySelector('[id^="popover-content-"]') as HTMLElement
      expect(popover).toBeTruthy()
      // The scrollable container is the inner div with role="region" and tabIndex={0}
      const scrollable = popover.querySelector('[role="region"][tabindex="0"]') as HTMLElement
      expect(scrollable).toBeTruthy()
      expect(scrollable.classList.contains('max-h-96')).toBe(true)
      expect(scrollable.classList.contains('overflow-y-auto')).toBe(true)
    })
  })

  // --- Loading skeleton inside popover test (spec: Loading state in popover) ---

  it('shows loading skeletons inside popover while fetching', async () => {
    const voucherApi = (await import('src/apis/voucher.api')).default
    // Mock API to never resolve — keeps loading state
    ;(voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise(() => {}),
    )
    renderWithProviders(<VoucherRow />)
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' })
    await user.hover(row)
    // Find the popover floating content, then check skeletons inside the scrollable region only
    await waitFor(() => {
      const popover = document.querySelector('[id^="popover-content-"]') as HTMLElement
      expect(popover).toBeTruthy()
      // Scope to the scrollable region inside the popover (role="region" with tabindex="0")
      const scrollable = popover.querySelector('[role="region"][tabindex="0"]') as HTMLElement
      expect(scrollable).toBeTruthy()
      // Each skeleton row has 3 animate-pulse elements (badge, text, button placeholder)
      // 3 rows × 3 elements = 9 total skeletons inside the scrollable region
      const skeletons = scrollable.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBe(9)
    })
  })
})
