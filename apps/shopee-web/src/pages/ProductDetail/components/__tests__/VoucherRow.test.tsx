import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoucherRow from '../VoucherRow';
import { renderWithProviders } from 'src/utils/testUtils';

// Mock framer-motion so AnimatePresence/motion.div render synchronously under fake timers
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

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
          ],
          pagination: { page: 1, limit: 10, total: 4, totalPages: 1 },
        },
      },
    }),
  },
}));

describe('VoucherRow (Task 3.10)', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders voucher row with label', async () => {
    vi.useRealTimers();
    renderWithProviders(<VoucherRow />);
    expect(screen.getByText('Mã Giảm Giá Của Shop')).toBeInTheDocument();
  });

  it('shows loading skeletons while fetching', () => {
    vi.useRealTimers();
    renderWithProviders(<VoucherRow />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays first 3 voucher badges after loading', async () => {
    vi.useRealTimers();
    renderWithProviders(<VoucherRow />);
    await waitFor(() => {
      const badges = document.querySelectorAll('.bg-orange-50');
      expect(badges.length).toBe(3);
    });
  });

  it('shows "see more" when more than 3 vouchers', async () => {
    vi.useRealTimers();
    renderWithProviders(<VoucherRow />);
    await waitFor(() => {
      expect(screen.getByText('Xem thêm')).toBeInTheDocument();
    });
  });

  it('opens modal on click (mobile fallback)', async () => {
    vi.useRealTimers();
    renderWithProviders(<VoucherRow />);
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' });
    await user.click(row);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('has keyboard support (Enter key)', async () => {
    vi.useRealTimers();
    renderWithProviders(<VoucherRow />);
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' });
    row.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('has keyboard support (Space key)', async () => {
    vi.useRealTimers();
    renderWithProviders(<VoucherRow />);
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' });
    row.focus();
    await user.keyboard(' ');
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('opens modal after 200ms hover delay', async () => {
    vi.useRealTimers();
    const realUser = userEvent.setup();
    renderWithProviders(<VoucherRow />);
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' });

    // Hover over the row — triggers 200ms setTimeout → setIsModalOpen(true)
    await realUser.hover(row);

    // Wait for the dialog to appear (200ms delay + React re-render + portal)
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('does not open modal if mouse leaves before 200ms', async () => {
    renderWithProviders(<VoucherRow />);
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' });

    // Trigger mouseEnter
    await act(async () => {
      row.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    });

    // Leave before 200ms
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    await act(async () => {
      row.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    });

    // Advance past 200ms
    await act(async () => {
      vi.advanceTimersByTime(200);
    });

    // Modal should NOT be open
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    vi.useRealTimers();
    renderWithProviders(<VoucherRow />);
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' });
    expect(row).toHaveAttribute('tabindex', '0');
    expect(row).toHaveAttribute('role', 'button');
  });

  it('has cursor-pointer and hover styles', () => {
    vi.useRealTimers();
    renderWithProviders(<VoucherRow />);
    const row = screen.getByRole('button', { name: 'Mã Giảm Giá Của Shop' });
    expect(row.classList.contains('cursor-pointer')).toBe(true);
    expect(row.classList.contains('hover:bg-gray-50')).toBe(true);
  });

  it('does not show "see more" when 3 or fewer vouchers', async () => {
    vi.useRealTimers();
    const voucherApi = (await import('src/apis/voucher.api')).default;
    (voucherApi.getAvailableVouchers as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
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
    });
    renderWithProviders(<VoucherRow />);
    await waitFor(() => {
      const badges = document.querySelectorAll('.bg-orange-50');
      expect(badges.length).toBe(2);
    });
    expect(screen.queryByText('Xem thêm')).not.toBeInTheDocument();
  });
});
