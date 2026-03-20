import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Wishlist from '../Wishlist';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, whileHover, layout, custom, ...rest } =
        props;
      return <div {...rest}>{children}</div>;
    },
    p: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = props;
      return <p {...rest}>{children}</p>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock sub-components
vi.mock('src/components/SEO', () => ({ default: () => null }));
vi.mock('src/components/WishlistPriceAlert', () => ({
  default: () => <div data-testid="price-alert" />,
}));
vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ariaLabel, ...rest } = props;
    return (
      <button onClick={onClick} className={className} {...rest}>
        {children}
      </button>
    );
  },
}));

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('src/constant/path', () => ({ default: { home: '/' } }));
vi.mock('src/hooks/useIsMobile', () => ({ useIsMobile: () => false }));
vi.mock('src/utils/utils', () => ({ formatCurrency: (n: number) => n.toLocaleString('vi-VN') }));

vi.mock('../components/WishlistCard', () => ({
  default: ({ item, onRemove, onAddToCart }: any) => (
    <div data-testid={`wishlist-card-${item._id}`}>
      <span>{item.product.name}</span>
      <button onClick={onRemove} data-testid={`remove-${item._id}`}>
        Remove
      </button>
      <button onClick={onAddToCart} data-testid={`cart-${item._id}`}>
        Cart
      </button>
    </div>
  ),
}));
vi.mock('../components/WishlistStats', () => ({
  default: ({ itemCount, totalValue, totalSavings }: any) => (
    <div data-testid="wishlist-stats">
      Items: {itemCount}, Value: {totalValue}, Savings: {totalSavings}
    </div>
  ),
}));
vi.mock('../components/WishlistFilters', () => ({
  default: ({ activeFilter, onFilterChange, onSortChange }: any) => (
    <div data-testid="wishlist-filters">
      <button onClick={() => onFilterChange('sale')} data-testid="filter-sale">
        Sale
      </button>
      <button onClick={() => onFilterChange('all')} data-testid="filter-all">
        All
      </button>
      <button onClick={() => onSortChange('priceAsc')} data-testid="sort-price">
        Price
      </button>
    </div>
  ),
}));
vi.mock('../components/WishlistSkeletonLoader', () => ({
  default: () => <div data-testid="skeleton-loader">Loading...</div>,
}));
vi.mock('../components/WishlistIcons', () => ({
  getCategoryIcon:
    () =>
    ({ className }: any) => <span data-testid="cat-icon" className={className} />,
  IconBell: ({ className }: any) => <span data-testid="icon-bell" className={className} />,
  IconFire: ({ className }: any) => <span data-testid="icon-fire" className={className} />,
  IconFolder: ({ className }: any) => <span data-testid="icon-folder" className={className} />,
  IconHeart: ({ className }: any) => <span data-testid="icon-heart" className={className} />,
  IconMagnifyingGlass: ({ className }: any) => (
    <span data-testid="icon-search" className={className} />
  ),
  IconSparkles: ({ className }: any) => <span data-testid="icon-sparkles" className={className} />,
  IconStar: ({ className }: any) => <span data-testid="icon-star" className={className} />,
  IconTarget: ({ className }: any) => <span data-testid="icon-target" className={className} />,
  IconTrendingDown: ({ className }: any) => (
    <span data-testid="icon-trending-down" className={className} />
  ),
  IconTrendingUp: ({ className }: any) => (
    <span data-testid="icon-trending-up" className={className} />
  ),
}));

vi.mock('../wishlist.constants', () => ({
  containerVariants: { hidden: {}, visible: {} },
  fadeInUp: { hidden: {}, visible: {} },
  itemVariants: { hidden: {}, visible: {} },
}));

const mockRemoveMutate = vi.fn();
const mockAddToCartMutate = vi.fn();

const mockItem = (id: string, name: string, categoryName = 'Điện tử') => ({
  _id: id,
  product: {
    _id: `prod-${id}`,
    name,
    category: { name: categoryName },
  },
});

const defaultHookReturn = {
  allWishlistItems: [mockItem('1', 'Phone'), mockItem('2', 'Laptop')],
  wishlistItems: [mockItem('1', 'Phone'), mockItem('2', 'Laptop')],
  productIds: ['prod-1', 'prod-2'],
  totalValue: 5000000,
  totalSavings: 500000,
  insights: { avgDiscount: 10, topCategory: 'Điện tử', topCategoryCount: 2, priceDropCount: 1 },
  isLoading: false,
  isRecentlyAdded: vi.fn(() => false),
  isTrending: vi.fn(() => false),
  getStockStatus: vi.fn(() => 'inStock'),
  getDiscountPercent: vi.fn(() => 10),
  removeMutation: { mutate: mockRemoveMutate },
  addToCartMutation: { mutate: mockAddToCartMutate },
};

let mockHookReturn = { ...defaultHookReturn };

vi.mock('../useWishlist', () => ({
  useWishlist: () => mockHookReturn,
}));

beforeEach(() => {
  mockHookReturn = { ...defaultHookReturn };
  vi.clearAllMocks();
});

describe('Wishlist', () => {
  it('shows skeleton loader when loading', () => {
    mockHookReturn = { ...defaultHookReturn, isLoading: true };
    render(<Wishlist />);
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    mockHookReturn = { ...defaultHookReturn, allWishlistItems: [], wishlistItems: [] };
    render(<Wishlist />);
    expect(screen.getByText('Chưa có sản phẩm yêu thích')).toBeInTheDocument();
    expect(screen.getByText('Mua sắm ngay')).toBeInTheDocument();
  });

  it('renders empty state subtitle', () => {
    mockHookReturn = { ...defaultHookReturn, allWishlistItems: [], wishlistItems: [] };
    render(<Wishlist />);
    expect(screen.getByText(/Hãy khám phá và thêm/)).toBeInTheDocument();
  });

  it('renders shop now link to home', () => {
    mockHookReturn = { ...defaultHookReturn, allWishlistItems: [], wishlistItems: [] };
    render(<Wishlist />);
    const link = screen.getByText('Mua sắm ngay').closest('a');
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders hero banner with item count', () => {
    render(<Wishlist />);
    expect(screen.getByText(/Theo dõi 2 sản phẩm bạn yêu thích/)).toBeInTheDocument();
  });

  it('renders header label and subtitle', () => {
    render(<Wishlist />);
    expect(screen.getByText('Danh sách yêu thích')).toBeInTheDocument();
    expect(screen.getByText(/Quản lý, so sánh giá/)).toBeInTheDocument();
  });

  it('renders price alert component', () => {
    render(<Wishlist />);
    expect(screen.getByTestId('price-alert')).toBeInTheDocument();
  });

  it('renders wishlist stats', () => {
    render(<Wishlist />);
    expect(screen.getByTestId('wishlist-stats')).toBeInTheDocument();
  });

  it('renders wishlist filters', () => {
    render(<Wishlist />);
    expect(screen.getByTestId('wishlist-filters')).toBeInTheDocument();
  });

  it('renders wishlist cards for each item', () => {
    render(<Wishlist />);
    expect(screen.getByTestId('wishlist-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('wishlist-card-2')).toBeInTheDocument();
  });

  it('renders insights banner with top category', () => {
    render(<Wishlist />);
    expect(screen.getByText('Insights:')).toBeInTheDocument();
    expect(screen.getByText(/Danh mục yêu thích nhất/)).toBeInTheDocument();
    expect(screen.getAllByText('Điện tử').length).toBeGreaterThanOrEqual(1);
  });

  it('renders price drop count when > 0', () => {
    render(<Wishlist />);
    expect(screen.getByText(/1 sản phẩm giảm >30%/)).toBeInTheDocument();
  });

  it('hides price drop count when 0', () => {
    mockHookReturn = {
      ...defaultHookReturn,
      insights: { ...defaultHookReturn.insights!, priceDropCount: 0 },
    };
    render(<Wishlist />);
    expect(screen.queryByText(/sản phẩm giảm >30%/)).not.toBeInTheDocument();
  });

  it('hides insights banner when insights is null', () => {
    mockHookReturn = { ...defaultHookReturn, insights: null as any };
    render(<Wishlist />);
    expect(screen.queryByText('Insights:')).not.toBeInTheDocument();
  });

  it('does not show results count when filter is all', () => {
    render(<Wishlist />);
    expect(screen.queryByText(/Hiển thị/)).not.toBeInTheDocument();
  });

  it('shows results count when filter is not all', () => {
    render(<Wishlist />);
    fireEvent.click(screen.getByTestId('filter-sale'));
    expect(screen.getByText(/Hiển thị 2 \/ 2 sản phẩm/)).toBeInTheDocument();
  });

  it('renders price tracking banner', () => {
    render(<Wishlist />);
    expect(screen.getByText('Theo dõi giá sản phẩm')).toBeInTheDocument();
    expect(screen.getByText('Bật thông báo')).toBeInTheDocument();
  });

  it('renders savings goal banner', () => {
    render(<Wishlist />);
    expect(screen.getByText('Mục tiêu tiết kiệm')).toBeInTheDocument();
  });

  it('renders category breakdown', () => {
    render(<Wishlist />);
    expect(screen.getByText('Phân loại yêu thích')).toBeInTheDocument();
  });

  it('shows empty filter result when filtered items is empty and filter is not all', () => {
    mockHookReturn = { ...defaultHookReturn, wishlistItems: [] };
    render(<Wishlist />);
    fireEvent.click(screen.getByTestId('filter-sale'));
    expect(screen.getByText('Không tìm thấy sản phẩm phù hợp')).toBeInTheDocument();
    expect(screen.getByText('Xem tất cả')).toBeInTheDocument();
  });

  it('handles view all button click in empty filter result', () => {
    mockHookReturn = { ...defaultHookReturn, wishlistItems: [] };
    render(<Wishlist />);
    fireEvent.click(screen.getByTestId('filter-sale'));
    fireEvent.click(screen.getByText('Xem tất cả'));
    // After clicking "view all", filter resets to 'all', so results count should disappear
    expect(screen.queryByText(/Hiển thị/)).not.toBeInTheDocument();
  });

  it('renders category breakdown with category name from product', () => {
    mockHookReturn = {
      ...defaultHookReturn,
      allWishlistItems: [mockItem('1', 'Phone', 'Phụ kiện'), mockItem('2', 'Shirt', 'Thời trang')],
      insights: { ...defaultHookReturn.insights!, topCategory: 'Phụ kiện' },
    };
    render(<Wishlist />);
    expect(screen.getAllByText('Phụ kiện').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Thời trang')).toBeInTheDocument();
  });

  it('uses categoryOther when product has no category', () => {
    mockHookReturn = {
      ...defaultHookReturn,
      allWishlistItems: [{ _id: '1', product: { _id: 'p1', name: 'X', category: null } } as any],
    };
    render(<Wishlist />);
    expect(screen.getByText('Khác')).toBeInTheDocument();
  });

  it('uses avgDiscount 0 when insights.avgDiscount is falsy', () => {
    mockHookReturn = {
      ...defaultHookReturn,
      insights: { ...defaultHookReturn.insights!, avgDiscount: 0 },
    };
    render(<Wishlist />);
    expect(screen.getByTestId('wishlist-stats')).toBeInTheDocument();
  });

  it('renders savings percent as 0 when totalValue + totalSavings is 0', () => {
    mockHookReturn = { ...defaultHookReturn, totalValue: 0, totalSavings: 0 };
    render(<Wishlist />);
    expect(screen.getByText(/Tiết kiệm 0% so với giá gốc/)).toBeInTheDocument();
  });

  it('renders savings percent correctly', () => {
    mockHookReturn = { ...defaultHookReturn, totalValue: 900000, totalSavings: 100000 };
    render(<Wishlist />);
    expect(screen.getByText(/Tiết kiệm 10% so với giá gốc/)).toBeInTheDocument();
  });
});
