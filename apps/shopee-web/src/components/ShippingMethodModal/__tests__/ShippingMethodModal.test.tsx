import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShippingMethodModal from '../ShippingMethodModal';
import { renderWithProviders } from 'src/utils/testUtils';

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
          {
            _id: 'express',
            name: 'Giao hàng nhanh',
            description: '1-2 ngày',
            price: 50000,
            estimatedDays: '1-2 ngày',
            icon: 'rocket',
          },
          {
            _id: 'same_day',
            name: 'Giao trong ngày',
            description: 'Trong ngày',
            price: 80000,
            estimatedDays: 'Trong ngày',
            icon: 'lightning',
          },
        ],
      },
    }),
  },
}));

describe('ShippingMethodModal (Task 4.8)', () => {
  const onClose = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with title when open', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Phương Thức Vận Chuyển')).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    renderWithProviders(<ShippingMethodModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByText('Phương Thức Vận Chuyển')).not.toBeInTheDocument();
  });

  it('shows loading skeletons initially', () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls onClose when close button clicked', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Phương Thức Vận Chuyển')).toBeInTheDocument();
    });
    const closeBtn = screen.getByLabelText('Đóng');
    await user.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('has accessible dialog structure', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has responsive width classes', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    const dialog = screen.getByRole('dialog');
    expect(dialog.classList.contains('w-full')).toBe(true);
    expect(dialog.classList.contains('max-w-[520px]')).toBe(true);
  });

  it('displays shipping methods after loading', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Giao hàng tiêu chuẩn')).toBeInTheDocument();
    });
    expect(screen.getByText('Giao hàng nhanh')).toBeInTheDocument();
    expect(screen.getByText('Giao trong ngày')).toBeInTheDocument();
  });

  it('shows free shipping promotion section', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Miễn Phí Vận Chuyển')).toBeInTheDocument();
    });
    expect(screen.getByText('Phí ship 0₫')).toBeInTheDocument();
  });

  it('shows late delivery voucher text', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(
        screen.getByText('Tặng Voucher ₫15.000 nếu đơn giao sau thời gian trên'),
      ).toBeInTheDocument();
    });
  });

  it('shows supported methods section header', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Phương thức vận chuyển được hỗ trợ')).toBeInTheDocument();
    });
  });

  it('shows address section with Từ/Đến', async () => {
    renderWithProviders(
      <ShippingMethodModal isOpen={true} onClose={onClose} location="Hồ Chí Minh" />,
    );
    await waitFor(() => {
      expect(screen.getByText('Từ:')).toBeInTheDocument();
    });
    expect(screen.getByText('Đến:')).toBeInTheDocument();
    expect(screen.getByText('Hồ Chí Minh')).toBeInTheDocument();
  });

  it('shows fastest badge on quickest method', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Nhanh nhất')).toBeInTheDocument();
    });
  });

  it('shows understood button and calls onClose', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Đã hiểu')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Đã hiểu'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('ShippingMethodModal - Error & Empty States', () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays error state with retry on API failure', async () => {
    const checkoutApi = (await import('src/apis/checkout.api')).default;
    (checkoutApi.getShippingMethods as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error'),
    );
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(
        screen.getByText('Không thể tải phương thức vận chuyển. Vui lòng thử lại.'),
      ).toBeInTheDocument();
    });
    expect(screen.getByText('Thử lại')).toBeInTheDocument();
  });

  it('displays empty state when no methods available', async () => {
    const checkoutApi = (await import('src/apis/checkout.api')).default;
    (checkoutApi.getShippingMethods as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { data: [] },
    });
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Không có phương thức vận chuyển khả dụng')).toBeInTheDocument();
    });
  });
});
