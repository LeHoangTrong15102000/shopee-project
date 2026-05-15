import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MyVouchers from '../MyVouchers'
import voucherApi from 'src/apis/voucher.api'
import { toast } from 'react-toastify'

// Uses global react-i18next mock from vitest.setup.js

vi.mock('src/apis/voucher.api')
vi.mock('react-toastify')
vi.mock('src/components/VoucherCard', () => ({
  default: ({ voucher, onApply, isLoading }: any) => (
    <div data-testid={`voucher-card-${voucher._id}`}>
      <span>{voucher.code}</span>
      <button onClick={() => onApply(voucher.code)} disabled={isLoading}>
        Apply
      </button>
    </div>
  ),
}))

vi.mock('src/components/SEO', () => ({
  default: ({ title, noindex }: any) => (
    <div data-testid="seo" data-title={title} data-noindex={noindex} />
  ),
}))

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, animated }: any) => (
    <button onClick={onClick} className={className} data-animated={animated}>
      {children}
    </button>
  ),
}))

const mockVouchers = [
  {
    _id: '1',
    code: 'SHOP10',
    discount_type: 'shop',
    status: 'available',
  },
  {
    _id: '2',
    code: 'FREESHIP',
    discount_type: 'shipping',
    status: 'available',
  },
  {
    _id: '3',
    code: 'USED20',
    discount_type: 'shop',
    status: 'used',
  },
  {
    _id: '4',
    code: 'EXPIRED30',
    discount_type: 'shop',
    status: 'expired',
  },
]

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('MyVouchers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    })
  })

  it('renders page header and SEO correctly', async () => {
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: [] } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    expect(screen.getByTestId('seo')).toHaveAttribute('data-title', 'Voucher của tôi')
    expect(screen.getByTestId('seo')).toHaveAttribute('data-noindex', 'true')
    expect(screen.getByText('Voucher của tôi')).toBeInTheDocument()
    expect(screen.getByText('Quản lý voucher của bạn')).toBeInTheDocument()
  })

  it('renders all category tabs', () => {
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: [] } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    const allButtons = screen.getAllByText('Tất cả')
    expect(allButtons.length).toBe(2) // one in category, one in status
    expect(screen.getByText('Voucher Shop')).toBeInTheDocument()
    expect(screen.getByText('Miễn phí vận chuyển')).toBeInTheDocument()
    expect(screen.getByText('Shopee')).toBeInTheDocument()
  })

  it('renders all status tabs', () => {
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: [] } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    const allButtons = screen.getAllByText('Tất cả')
    expect(allButtons.length).toBeGreaterThan(0)
    expect(screen.getByText('Có thể sử dụng')).toBeInTheDocument()
    expect(screen.getByText('Đã sử dụng')).toBeInTheDocument()
    expect(screen.getByText('Hết hạn')).toBeInTheDocument()
  })

  it('displays loading skeletons while fetching vouchers', () => {
    vi.mocked(voucherApi.getMyVouchers).mockImplementation(() => new Promise(() => {}))

    render(<MyVouchers />, { wrapper: createWrapper() })

    const skeletons = screen
      .getAllByRole('generic')
      .filter((el) => el.className.includes('animate-pulse'))
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('displays empty state when no vouchers available', async () => {
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: [] } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('Chưa có voucher nào')).toBeInTheDocument()
    })

    expect(screen.getByText('Thu thập voucher ngay')).toBeInTheDocument()
    expect(screen.getByText('Thu thập voucher ngay')).toHaveAttribute('href', '/vouchers')
  })

  it('displays vouchers when data is loaded', async () => {
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: mockVouchers } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('voucher-card-1')).toBeInTheDocument()
    })

    expect(screen.getByTestId('voucher-card-2')).toBeInTheDocument()
    expect(screen.getByTestId('voucher-card-3')).toBeInTheDocument()
    expect(screen.getByTestId('voucher-card-4')).toBeInTheDocument()
  })

  it('filters vouchers by category when category tab is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: mockVouchers } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('voucher-card-1')).toBeInTheDocument()
    })

    const shippingButton = screen.getByText('Miễn phí vận chuyển')
    await user.click(shippingButton)

    expect(screen.queryByTestId('voucher-card-1')).not.toBeInTheDocument()
    expect(screen.getByTestId('voucher-card-2')).toBeInTheDocument()
    expect(screen.queryByTestId('voucher-card-3')).not.toBeInTheDocument()
  })

  it('changes status tab and refetches vouchers', async () => {
    const user = userEvent.setup()
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: mockVouchers } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(voucherApi.getMyVouchers).toHaveBeenCalledWith({
        status: undefined,
      })
    })

    const usedButton = screen.getByText('Đã sử dụng')
    await user.click(usedButton)

    await waitFor(() => {
      expect(voucherApi.getMyVouchers).toHaveBeenCalledWith({
        status: 'used',
      })
    })
  })

  it('copies voucher code to clipboard and shows toast when apply is clicked', async () => {
    const user = userEvent.setup()
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    })
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: mockVouchers } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('voucher-card-1')).toBeInTheDocument()
    })

    const applyButton = screen.getAllByText('Apply')[0]
    await user.click(applyButton)

    expect(writeTextMock).toHaveBeenCalledWith('SHOP10')
    expect(toast.success).toHaveBeenCalledWith('Đã sao chép mã: SHOP10', {
      autoClose: 1500,
    })
  })

  it('filters shop vouchers correctly', async () => {
    const user = userEvent.setup()
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: mockVouchers } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('voucher-card-1')).toBeInTheDocument()
    })

    const shopButton = screen.getByText('Voucher Shop')
    await user.click(shopButton)

    expect(screen.getByTestId('voucher-card-1')).toBeInTheDocument()
    expect(screen.queryByTestId('voucher-card-2')).not.toBeInTheDocument()
    expect(screen.getByTestId('voucher-card-3')).toBeInTheDocument()
    expect(screen.getByTestId('voucher-card-4')).toBeInTheDocument()
  })

  it('shows all vouchers when "Tất cả" category is selected', async () => {
    const user = userEvent.setup()
    vi.mocked(voucherApi.getMyVouchers).mockResolvedValue({
      data: { data: { vouchers: mockVouchers } },
    } as any)

    render(<MyVouchers />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByTestId('voucher-card-1')).toBeInTheDocument()
    })

    const shopButton = screen.getByText('Voucher Shop')
    await user.click(shopButton)

    expect(screen.queryByTestId('voucher-card-2')).not.toBeInTheDocument()

    const allCategoryButtons = screen.getAllByText('Tất cả')
    const categoryAllButton = allCategoryButtons[0]
    await user.click(categoryAllButton)

    expect(screen.getByTestId('voucher-card-1')).toBeInTheDocument()
    expect(screen.getByTestId('voucher-card-2')).toBeInTheDocument()
  })
})
