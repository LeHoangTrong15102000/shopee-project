import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShippingInfo from '../ShippingInfo';
import { renderWithProviders } from 'src/utils/testUtils';

vi.mock('src/utils/date', () => ({
  getEstimatedDeliveryDate: vi.fn(() => '15/03 - 18/03'),
}));

vi.mock('src/apis/checkout.api', () => ({
  default: {
    getShippingMethods: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: 'standard',
            name: 'Giao hàng tiêu chuẩn',
            description: '3-5 ngày',
            price: 30000,
            estimatedDays: '3-5 ngày',
            icon: 'truck',
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
    // Should have truck icon + chevron icon
    expect(svgs.length).toBeGreaterThanOrEqual(2);
  });

  it('opens modal on click', async () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    await user.click(row);
    await waitFor(() => {
      expect(screen.getByText('Phương Thức Vận Chuyển')).toBeInTheDocument();
    });
  });

  it('opens modal on Enter key', async () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    row.focus();
    await user.keyboard('{Enter}');
    await waitFor(() => {
      expect(screen.getByText('Phương Thức Vận Chuyển')).toBeInTheDocument();
    });
  });

  it('opens modal on Space key', async () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    row.focus();
    await user.keyboard(' ');
    await waitFor(() => {
      expect(screen.getByText('Phương Thức Vận Chuyển')).toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes', () => {
    renderWithProviders(<ShippingInfo location="Hồ Chí Minh" />);
    const row = screen.getByRole('button', { name: 'Vận Chuyển' });
    expect(row).toHaveAttribute('tabindex', '0');
    expect(row).toHaveAttribute('role', 'button');
  });
});
