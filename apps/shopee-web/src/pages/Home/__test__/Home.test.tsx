import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Home from '../Home';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => {
      const {
        initial,
        animate,
        exit,
        transition,
        variants,
        whileHover,
        whileInView,
        viewport,
        layout,
        ...rest
      } = p;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock('src/components/HeroBanner', () => ({
  default: () => <div data-testid="hero-banner">banner</div>,
}));

vi.mock('src/components/FlashSale', () => ({
  FlashSaleTimer: () => <div data-testid="flash-sale-timer">timer</div>,
}));

vi.mock('src/components/OptimizedImage', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} />,
}));

vi.mock('src/components/SEO', () => ({
  default: () => null,
  SITE_URL: 'https://shopee.vn',
}));

vi.mock('src/apis/category.api', () => ({
  default: {
    getCategories: vi.fn().mockResolvedValue({
      data: {
        data: [
          { _id: 'c1', name: 'Điện tử' },
          { _id: 'c2', name: 'Thời trang' },
        ],
      },
    }),
  },
}));

vi.mock('src/apis/product.api', () => ({
  default: {
    getProducts: vi.fn().mockResolvedValue({
      data: {
        data: {
          products: [
            {
              _id: 'p1',
              name: 'Sản phẩm 1',
              price: 100000,
              price_before_discount: 200000,
              sold: 500,
              rating: 4.5,
              image: 'img1.jpg',
            },
          ],
        },
      },
    }),
  },
}));

vi.mock('src/hooks/useFlashSale', () => ({
  default: () => ({
    remainingSeconds: 3600,
    products: [],
    isActive: true,
    isEnded: false,
    isConnectedToServer: true,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Home', () => {
  it('renders hero banner', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByTestId('hero-banner')).toBeInTheDocument();
  });

  it('renders flash sale timer', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByTestId('flash-sale-timer')).toBeInTheDocument();
  });

  it('renders FLASH SALE heading', () => {
    render(<Home />, { wrapper: createWrapper() });
    expect(screen.getByText('FLASH SALE')).toBeInTheDocument();
  });

  it('renders category section heading', async () => {
    render(<Home />, { wrapper: createWrapper() });
    // Category title from Vietnamese translations
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it('renders view all links', () => {
    render(<Home />, { wrapper: createWrapper() });
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('renders CTA section', () => {
    render(<Home />, { wrapper: createWrapper() });
    // CTA section has a link with arrow icon
    const svgs = document.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(1);
  });
});
