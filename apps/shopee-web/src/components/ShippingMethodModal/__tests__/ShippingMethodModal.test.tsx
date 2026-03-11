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
              { text: 'Miễn phí vận chuyển đơn tối thiểu 0₫', type: 'free_threshold' },
            ],
          },
          {
            _id: 'express',
            name: 'Nhanh',
            description: 'Giao hàng nhanh trong 1-2 ngày',
            price: 30800,
            estimatedDays: '1 ngày',
            icon: 'rocket',
            type: 'express',
            details: [
              { text: 'Tặng Voucher ₫15.000 nếu đơn giao sau thời gian trên', type: 'voucher' },
            ],
          },
          {
            _id: 'standard',
            name: 'Tiết Kiệm',
            description: 'Giao hàng tiết kiệm trong 3-5 ngày',
            price: 16500,
            estimatedDays: '3-5 ngày',
            icon: 'standard',
            type: 'economy',
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
      expect(screen.getByText('Thông tin về phí vận chuyển')).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    renderWithProviders(<ShippingMethodModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByText('Thông tin về phí vận chuyển')).not.toBeInTheDocument();
  });

  it('shows loading skeletons initially', () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('calls onClose when close button clicked', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Thông tin về phí vận chuyển')).toBeInTheDocument();
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
      expect(screen.getByText('Hỏa Tốc')).toBeInTheDocument();
    });
    expect(screen.getByText('Nhanh')).toBeInTheDocument();
    expect(screen.getByText('Tiết Kiệm')).toBeInTheDocument();
  });

  it('shows delivery address section', async () => {
    renderWithProviders(
      <ShippingMethodModal isOpen={true} onClose={onClose} location="Phường Linh Trung, Thủ Đức" />,
    );
    await waitFor(() => {
      expect(screen.getByText(/Vận chuyển tới/)).toBeInTheDocument();
    });
    expect(screen.getByText('Phường Linh Trung, Thủ Đức')).toBeInTheDocument();
  });

  it('shows instant delivery badge with hours', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('4 Giờ')).toBeInTheDocument();
    });
  });

  it('shows free text instead of 0đ', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      const freeTexts = screen.getAllByText('Miễn phí');
      expect(freeTexts.length).toBeGreaterThan(0);
    });
  });

  it('shows method details for instant delivery', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(
        screen.getByText('Tặng Voucher ₫20.000 nếu đơn giao sau thời gian trên'),
      ).toBeInTheDocument();
    });
  });

  it('shows understood button and calls onClose', async () => {
    renderWithProviders(<ShippingMethodModal isOpen={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText('Đã Hiểu')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Đã Hiểu'));
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
