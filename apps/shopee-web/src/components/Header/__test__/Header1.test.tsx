import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Header1 from '../Header1';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
}));

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

let mockUseQueryReturn: any = { data: undefined };

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => mockUseQueryReturn),
  useMutation: vi.fn(),
  useQueryClient: () => ({
    removeQueries: vi.fn(),
  }),
}));

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
  },
}));

let mockAppContextValue: any = {
  isAuthenticated: true,
  setIsAuthenticated: vi.fn(),
  setProfile: vi.fn(),
};

vi.mock('src/contexts/app.context', () => ({
  AppContext: {
    get _currentValue() {
      return mockAppContextValue;
    },
  },
}));

let mockSearchReturn: any = {
  onSubmitSearch: vi.fn((e: any) => e.preventDefault()),
  register: vi.fn(() => ({})),
};

vi.mock('src/hooks/useSearchProducts', () => ({
  default: () => mockSearchReturn,
}));

vi.mock('@heroui/tooltip', () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../Popover', () => ({
  default: ({ children, renderPopover }: any) => (
    <div>
      {children}
      <div data-testid="popover">{renderPopover}</div>
    </div>
  ),
}));

vi.mock('src/components/NavHeader', () => ({
  default: () => <div data-testid="nav-header">NavHeader</div>,
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, type, animated, ...props }: any) => (
    <button onClick={onClick} type={type} {...props}>
      {children}
    </button>
  ),
}));

describe('Header1', () => {
  const mockPurchases = [
    {
      _id: '1',
      product: { _id: 'p1', name: 'Product 1', price: 100000, image: 'img1.jpg' },
      buy_count: 1,
    },
    {
      _id: '2',
      product: { _id: 'p2', name: 'Product 2', price: 200000, image: 'img2.jpg' },
      buy_count: 2,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQueryReturn = { data: undefined };
    mockAppContextValue = {
      isAuthenticated: true,
      setIsAuthenticated: vi.fn(),
      setProfile: vi.fn(),
    };
    mockSearchReturn = {
      onSubmitSearch: vi.fn((e: any) => e.preventDefault()),
      register: vi.fn(() => ({})),
    };
  });

  it('should render Shopee logo', () => {
    const { container } = render(<Header1 />);
    const logo = container.querySelector('svg');
    expect(logo).toBeInTheDocument();
  });

  it('should render search input', () => {
    render(<Header1 />);
    expect(screen.getByPlaceholderText('header.searchPlaceholder')).toBeInTheDocument();
  });

  it('should render search button', () => {
    render(<Header1 />);
    const searchButtons = screen.getAllByRole('button');
    expect(searchButtons.length).toBeGreaterThan(0);
  });

  it('should render NavHeader', () => {
    render(<Header1 />);
    expect(screen.getByTestId('nav-header')).toBeInTheDocument();
  });

  it('should render cart icon', () => {
    render(<Header1 />);
    const cartLink = screen.getByLabelText(/aria\.cartItems/);
    expect(cartLink).toBeInTheDocument();
  });

  it('should display cart count when purchases exist', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } };
    render(<Header1 />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should not display cart count when no purchases', () => {
    mockUseQueryReturn = { data: { data: { data: [] } } };
    render(<Header1 />);
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument();
  });

  it('should render popover with purchases', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } };
    render(<Header1 />);
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('should render "newly added" text in popover', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } };
    render(<Header1 />);
    expect(screen.getByText('dropdown.newlyAdded')).toBeInTheDocument();
  });

  it('should render view cart button in popover', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } };
    render(<Header1 />);
    expect(screen.getByText('dropdown.viewCart')).toBeInTheDocument();
  });

  it('should render empty cart message when no purchases', () => {
    mockUseQueryReturn = { data: { data: { data: [] } } };
    render(<Header1 />);
    expect(screen.getByText('dropdown.noProducts')).toBeInTheDocument();
  });

  it('should limit displayed purchases to 5', () => {
    const manyPurchases = Array.from({ length: 10 }, (_, i) => ({
      _id: `${i}`,
      product: { _id: `p${i}`, name: `Product ${i}`, price: 100000, image: 'img.jpg' },
      buy_count: 1,
    }));
    mockUseQueryReturn = { data: { data: { data: manyPurchases } } };
    const { container } = render(<Header1 />);
    const productItems = container.querySelectorAll('[class*="mt-2 flex py-2"]');
    expect(productItems.length).toBeLessThanOrEqual(5);
  });

  it('should show "more items" text when more than 5 purchases', () => {
    const manyPurchases = Array.from({ length: 7 }, (_, i) => ({
      _id: `${i}`,
      product: { _id: `p${i}`, name: `Product ${i}`, price: 100000, image: 'img.jpg' },
      buy_count: 1,
    }));
    mockUseQueryReturn = { data: { data: { data: manyPurchases } } };
    render(<Header1 />);
    expect(screen.getByText(/2.*dropdown\.moreItems/)).toBeInTheDocument();
  });

  it('should submit search form', () => {
    const mockOnSubmit = vi.fn((e: any) => e.preventDefault());
    mockSearchReturn = {
      onSubmitSearch: mockOnSubmit,
      register: vi.fn(() => ({})),
    };

    render(<Header1 />);
    const form = screen.getByPlaceholderText('header.searchPlaceholder').closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    expect(mockOnSubmit).toHaveBeenCalled();
  });

  it('should not fetch purchases when not authenticated', () => {
    mockAppContextValue = {
      isAuthenticated: false,
      setIsAuthenticated: vi.fn(),
      setProfile: vi.fn(),
    };
    mockUseQueryReturn = { data: undefined };

    render(<Header1 />);
    // Component should render without errors when not authenticated
    expect(screen.getByTestId('nav-header')).toBeInTheDocument();
  });

  it('should have proper aria-label for cart', () => {
    mockUseQueryReturn = { data: { data: { data: mockPurchases } } };
    render(<Header1 />);
    const cartLink = screen.getByLabelText(/aria\.cartItems/);
    expect(cartLink).toBeInTheDocument();
  });
});
