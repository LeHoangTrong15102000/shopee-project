import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShippingInfo from '../ShippingInfo';
import { renderWithProviders } from 'src/utils/testUtils';

vi.mock('src/utils/date', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/utils/date')>();
  return {
    ...actual,
    getEstimatedDeliveryDate: vi.fn(() => '15/03 - 18/03'),
  };
});

vi.mock('src/apis/checkout.api', () => ({
  default: {
    getShippingMethods: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: 'instant',
            name: 'Hỏa Tốc',
            description: 'Giao hàng siêu nhanh trong vòng 4 giờ',
            price: 112600,
            estimatedDays: '4 giờ',
            icon: 'truck',
            type: 'instant',
            deliveryHours: 4,
            details: [
              { text: 'Tặng Voucher ₫20.000 nếu đơn giao sau thời gian trên', type: 'voucher' },
            ],
          },
        ],
      },
    }),
  },
}));

describe('ShippingInfo (Task 5.7)', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shipping info with label', () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    expect(screen.getByText('Vận Chuyển')).toBeInTheDocument();
  });

  it('shows free shipping badge', () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    expect(screen.getByText('Miễn Phí Vận Chuyển')).toBeInTheDocument();
  });

  it('shows estimated delivery date', () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    expect(screen.getByText(/15\/03/)).toBeInTheDocument();
  });

  it('has cursor-pointer class', () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    expect(row.classList.contains('cursor-pointer')).toBe(true);
  });

  it('has hover effect styling', () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    expect(row.classList.contains('hover:bg-gray-50')).toBe(true);
  });

  it('has chevron-right icon', () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const svgs = document.querySelectorAll('svg[aria-hidden="true"]');
    // Should have truck icon + chevron icon (compact layout)
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('opens modal on click', async () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    await user.click(row);
    await waitFor(() => {
      expect(screen.getByText('Thông tin về phí vận chuyển')).toBeInTheDocument();
    });
  });

  it('opens modal on Enter key', async () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    row.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByText('Thông tin về phí vận chuyển')).toBeInTheDocument();
    });
  });

  it('opens modal on Space key', async () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    row.focus();
    await user.keyboard(' ');
    await waitFor(() => {
      expect(screen.getByText('Thông tin về phí vận chuyển')).toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes', () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    expect(row).toHaveAttribute('tabindex', '0');
    expect(row).toHaveAttribute('role', 'button');
  });
});
