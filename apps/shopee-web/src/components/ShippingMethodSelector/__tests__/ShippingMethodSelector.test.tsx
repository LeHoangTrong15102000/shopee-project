import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShippingMethodSelector from '../ShippingMethodSelector';
import { renderWithProviders } from 'src/utils/testUtils';

// Override global i18n mock to handle namespace-prefixed keys and defaultValue
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const translations: Record<string, string> = {
        'shipping.selectMethod': 'Chọn phương thức vận chuyển',
        'shipping.express': 'Giao nhanh',
        'shipping.free': 'Miễn phí',
        'shipping.estimatedTime': 'Thời gian giao hàng dự kiến',
        'shipping.estimatedDeliveryLabel': 'Ngày giao hàng dự kiến',
      };
      return translations[key] || options?.defaultValue || key;
    },
    i18n: { changeLanguage: vi.fn(), language: 'vi' },
  }),
}));

vi.mock('src/apis/checkout.api', () => ({
  default: {
    getShippingMethods: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: 'standard',
            name: 'Giao hàng tiêu chuẩn',
            description: 'Giao hàng trong 3-5 ngày',
            price: 30000,
            estimatedDays: '3-5 ngày',
            icon: 'truck',
          },
          {
            _id: 'express',
            name: 'Giao hàng nhanh',
            description: 'Giao hàng trong 1 ngày',
            price: 50000,
            estimatedDays: '1 ngày',
            icon: 'rocket',
          },
          {
            _id: 'free',
            name: 'Giao hàng miễn phí',
            description: 'Miễn phí vận chuyển',
            price: 0,
            estimatedDays: '5-7 ngày',
            icon: 'truck',
          },
        ],
      },
    }),
  },
}));

vi.mock('src/utils/date', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/utils/date')>();
  return {
    ...actual,
    getEstimatedDeliveryDate: vi.fn(() => '15/03 - 18/03'),
  };
});

describe('ShippingMethodSelector', () => {
  const onSelect = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeletons while fetching', () => {
    renderWithProviders(<ShippingMethodSelector selectedMethodId={null} onSelect={onSelect} />);
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders shipping methods from API', async () => {
    renderWithProviders(<ShippingMethodSelector selectedMethodId={null} onSelect={onSelect} />);
    await waitFor(() => {
      expect(screen.getByText('Giao hàng tiêu chuẩn')).toBeInTheDocument();
    });
    expect(screen.getByText('Giao hàng nhanh')).toBeInTheDocument();
    expect(screen.getByText('Giao hàng miễn phí')).toBeInTheDocument();
  });

  it('shows "Miễn phí" for price=0 methods', async () => {
    renderWithProviders(<ShippingMethodSelector selectedMethodId={null} onSelect={onSelect} />);
    await waitFor(() => {
      expect(screen.getByText('Miễn phí')).toBeInTheDocument();
    });
  });

  it('shows "Giao nhanh" badge for estimatedDays<=1', async () => {
    renderWithProviders(<ShippingMethodSelector selectedMethodId={null} onSelect={onSelect} />);
    await waitFor(() => {
      expect(screen.getByText('Giao nhanh')).toBeInTheDocument();
    });
  });

  it('calls onSelect when method clicked', async () => {
    renderWithProviders(<ShippingMethodSelector selectedMethodId={null} onSelect={onSelect} />);
    await waitFor(() => {
      expect(screen.getByText('Giao hàng tiêu chuẩn')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Giao hàng tiêu chuẩn'));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ _id: 'standard', name: 'Giao hàng tiêu chuẩn' }),
    );
  });

  it('activates on Space key', async () => {
    renderWithProviders(<ShippingMethodSelector selectedMethodId={null} onSelect={onSelect} />);
    await waitFor(() => {
      expect(screen.getByText('Giao hàng tiêu chuẩn')).toBeInTheDocument();
    });
    const methodEl = screen.getByText('Giao hàng tiêu chuẩn').closest('[role="radio"]')!;
    fireEvent.keyDown(methodEl, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ _id: 'standard' }));
  });

  it('highlights selected method with border-orange', async () => {
    renderWithProviders(<ShippingMethodSelector selectedMethodId="standard" onSelect={onSelect} />);
    await waitFor(() => {
      expect(screen.getByText('Giao hàng tiêu chuẩn')).toBeInTheDocument();
    });
    const selectedEl = screen.getByText('Giao hàng tiêu chuẩn').closest('[role="radio"]')!;
    expect(selectedEl.classList.contains('border-orange')).toBe(true);
  });

  it('shows formatted price for paid methods', async () => {
    renderWithProviders(<ShippingMethodSelector selectedMethodId={null} onSelect={onSelect} />);
    await waitFor(() => {
      expect(screen.getByText('₫30.000')).toBeInTheDocument();
    });
  });

  it('has loading skeleton with motion-reduce:animate-none', () => {
    renderWithProviders(<ShippingMethodSelector selectedMethodId={null} onSelect={onSelect} />);
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton?.classList.contains('motion-reduce:animate-none')).toBe(true);
  });
});
