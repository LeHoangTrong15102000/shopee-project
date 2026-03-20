import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState, { EmptyCart, EmptySearch, EmptyWishlist, EmptyOrders } from '../EmptyState';

vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string, params?: any) => {
      const translations: Record<string, string> = {
        'empty.title': 'Giỏ hàng trống',
        'empty.description': 'Hãy thêm sản phẩm vào giỏ hàng',
        'empty.shopNow': 'Mua sắm ngay',
        'search.noResults': 'Không tìm thấy kết quả',
        'search.noResultsFor': `Không tìm thấy kết quả cho "${params?.term}"`,
        'search.noResultsGeneric': 'Không tìm thấy kết quả nào',
        'search.clearFilters': 'Xóa bộ lọc',
        'wishlist.emptyTitle': 'Danh sách yêu thích trống',
        'wishlist.emptyDescription': 'Thêm sản phẩm yêu thích',
        'wishlist.exploreNow': 'Khám phá ngay',
        'orders.emptyTitle': 'Chưa có đơn hàng',
        'orders.emptyDescription': 'Bạn chưa có đơn hàng nào',
        'orders.shopNow': 'Mua sắm ngay',
      };
      return translations[key] || key;
    },
  }),
}));

let mockReducedMotion = false;

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => mockReducedMotion,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
}));

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<EmptyState title="Test Title" description="Test Description" />);
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('does not render description when not provided', () => {
    render(<EmptyState title="Test Title" />);
    expect(screen.queryByText('Test Description')).not.toBeInTheDocument();
  });

  it('renders custom icon when provided', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;
    render(<EmptyState title="Test" icon={<CustomIcon />} />);
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('renders default icon when no icon provided', () => {
    const { container } = render(<EmptyState title="Test" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const onClick = vi.fn();
    render(<EmptyState title="Test" action={{ label: 'Click Me', onClick }} />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toBeInTheDocument();
  });

  it('calls action onClick when button is clicked', () => {
    const onClick = vi.fn();
    render(<EmptyState title="Test" action={{ label: 'Click Me', onClick }} />);
    const button = screen.getByRole('button', { name: 'Click Me' });
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not render action button when not provided', () => {
    render(<EmptyState title="Test" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState title="Test" className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders with reduced motion', () => {
    mockReducedMotion = true;
    render(<EmptyState title="Test" description="Description" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
  });
});

describe('EmptyCart', () => {
  it('renders empty cart message', () => {
    render(<EmptyCart />);
    expect(screen.getByText('Giỏ hàng trống')).toBeInTheDocument();
    expect(screen.getByText('Hãy thêm sản phẩm vào giỏ hàng')).toBeInTheDocument();
  });

  it('renders shop now button when onShopNow is provided', () => {
    const onShopNow = vi.fn();
    render(<EmptyCart onShopNow={onShopNow} />);
    const button = screen.getByRole('button', { name: 'Mua sắm ngay' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onShopNow).toHaveBeenCalledTimes(1);
  });

  it('does not render button when onShopNow is not provided', () => {
    render(<EmptyCart />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('EmptySearch', () => {
  it('renders no results message', () => {
    render(<EmptySearch />);
    expect(screen.getByText('Không tìm thấy kết quả')).toBeInTheDocument();
  });

  it('renders search term when provided', () => {
    render(<EmptySearch searchTerm="laptop" />);
    expect(screen.getByText('Không tìm thấy kết quả cho "laptop"')).toBeInTheDocument();
  });

  it('renders generic message when no search term', () => {
    render(<EmptySearch />);
    expect(screen.getByText('Không tìm thấy kết quả nào')).toBeInTheDocument();
  });

  it('renders clear filters button when onClear is provided', () => {
    const onClear = vi.fn();
    render(<EmptySearch onClear={onClear} />);
    const button = screen.getByRole('button', { name: 'Xóa bộ lọc' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyWishlist', () => {
  it('renders empty wishlist message', () => {
    render(<EmptyWishlist />);
    expect(screen.getByText('Danh sách yêu thích trống')).toBeInTheDocument();
    expect(screen.getByText('Thêm sản phẩm yêu thích')).toBeInTheDocument();
  });

  it('renders explore button when onExplore is provided', () => {
    const onExplore = vi.fn();
    render(<EmptyWishlist onExplore={onExplore} />);
    const button = screen.getByRole('button', { name: 'Khám phá ngay' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onExplore).toHaveBeenCalledTimes(1);
  });
});

describe('EmptyOrders', () => {
  it('renders empty orders message', () => {
    render(<EmptyOrders />);
    expect(screen.getByText('Chưa có đơn hàng')).toBeInTheDocument();
    expect(screen.getByText('Bạn chưa có đơn hàng nào')).toBeInTheDocument();
  });

  it('renders shop now button when onShopNow is provided', () => {
    const onShopNow = vi.fn();
    render(<EmptyOrders onShopNow={onShopNow} />);
    const button = screen.getByRole('button', { name: 'Mua sắm ngay' });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onShopNow).toHaveBeenCalledTimes(1);
  });
});
