import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AsideFilter from '../AsideFilter';
import { Category } from 'src/types/category.type';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={typeof to === 'string' ? to : to.pathname} {...props}>
      {children}
    </a>
  ),
  createSearchParams: (params: any) => new URLSearchParams(params),
}));

const mockTrigger = vi.fn();
const mockReset = vi.fn();
let mockFormReturn: any = {
  control: {},
  handleSubmit: (onValid: any) => (e: any) => {
    e?.preventDefault?.();
    onValid({ price_min: '100', price_max: '500' });
  },
  trigger: mockTrigger,
  reset: mockReset,
  formState: { errors: {} },
};

vi.mock('react-hook-form', () => ({
  useForm: () => mockFormReturn,
  Controller: ({ render }: any) =>
    render({
      field: {
        onChange: vi.fn(),
        value: '',
        ref: vi.fn(),
      },
    }),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => vi.fn(),
}));

let mockQueryStatesReturn: any;
const mockSetFilters = vi.fn();

vi.mock('src/hooks/nuqs', () => ({
  useProductQueryStates: () => mockQueryStatesReturn,
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('src/components/InputNumber', () => ({
  default: ({ onChange, value, placeholder, ...props }: any) => (
    <input type="text" onChange={onChange} value={value} placeholder={placeholder} {...props} />
  ),
}));

vi.mock('src/pages/ProductList/components/RatingStars', () => ({
  default: () => <div data-testid="rating-stars">Rating Stars</div>,
}));

describe('AsideFilter', () => {
  const mockCategories: Category[] = [
    { _id: '1', name: 'Electronics', __v: 0 },
    { _id: '2', name: 'Fashion', __v: 0 },
    { _id: '3', name: 'Books', __v: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryStatesReturn = [{ category: null }, mockSetFilters];
    mockFormReturn = {
      control: {},
      handleSubmit: (onValid: any) => (e: any) => {
        e?.preventDefault?.();
        onValid({ price_min: '100', price_max: '500' });
      },
      trigger: mockTrigger,
      reset: mockReset,
      formState: { errors: {} },
    };
  });

  it('should render all categories', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Fashion')).toBeInTheDocument();
    expect(screen.getByText('Books')).toBeInTheDocument();
  });

  it('should render "All categories" link', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByText('aside filter.all categories')).toBeInTheDocument();
  });

  it('should highlight active category', () => {
    mockQueryStatesReturn = [{ category: '1' }, mockSetFilters];
    render(<AsideFilter categories={mockCategories} />);
    const electronicsLink = screen.getByText('Electronics');
    expect(electronicsLink).toHaveClass('text-orange');
  });

  it('should render price range inputs', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByPlaceholderText('filter.fromPlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('filter.toPlaceholder')).toBeInTheDocument();
  });

  it('should render apply button', () => {
    render(<AsideFilter categories={mockCategories} />);
    const applyButtons = screen.getAllByLabelText('filter.apply');
    expect(applyButtons.length).toBeGreaterThan(0);
  });

  it('should render clear all button', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByLabelText('filter.clearAll')).toBeInTheDocument();
  });

  it('should call setFilters when form is submitted', async () => {
    render(<AsideFilter categories={mockCategories} />);
    const form = screen.getByPlaceholderText('filter.fromPlaceholder').closest('form');
    if (form) {
      fireEvent.submit(form);
    }
    await waitFor(() => {
      expect(mockSetFilters).toHaveBeenCalled();
    });
  });

  it('should call reset and setFilters when clear all is clicked', () => {
    mockFormReturn = {
      control: {},
      handleSubmit: (onValid: any) => (e: any) => {
        e?.preventDefault?.();
        onValid({});
      },
      trigger: vi.fn(),
      reset: mockReset,
      formState: { errors: {} },
    };

    render(<AsideFilter categories={mockCategories} />);
    const clearButton = screen.getByLabelText('filter.clearAll');
    fireEvent.click(clearButton);
    expect(mockReset).toHaveBeenCalled();
    expect(mockSetFilters).toHaveBeenCalledWith({
      price_min: null,
      price_max: null,
      category: null,
      rating_filter: null,
    });
  });

  it('should render rating stars component', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByTestId('rating-stars')).toBeInTheDocument();
  });

  it('should render search filter section', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByText('aside filter.search filter')).toBeInTheDocument();
  });

  it('should render price range label', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByText('filter.priceRange')).toBeInTheDocument();
  });

  it('should render rating label', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByText('filter.rating')).toBeInTheDocument();
  });

  it('should have navigation role', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('should have proper aria-label', () => {
    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByLabelText('filter.ariaLabel')).toBeInTheDocument();
  });

  it('should trigger validation on price_max when price_min changes', () => {
    mockFormReturn = {
      control: {},
      handleSubmit: vi.fn(),
      trigger: mockTrigger,
      reset: vi.fn(),
      formState: { errors: {} },
    };

    render(<AsideFilter categories={mockCategories} />);
    const minInput = screen.getByPlaceholderText('filter.fromPlaceholder');
    fireEvent.change(minInput, { target: { value: '100' } });
    expect(mockTrigger).toHaveBeenCalledWith('price_max');
  });

  it('should trigger validation on price_min when price_max changes', () => {
    mockFormReturn = {
      control: {},
      handleSubmit: vi.fn(),
      trigger: mockTrigger,
      reset: vi.fn(),
      formState: { errors: {} },
    };

    render(<AsideFilter categories={mockCategories} />);
    const maxInput = screen.getByPlaceholderText('filter.toPlaceholder');
    fireEvent.change(maxInput, { target: { value: '500' } });
    expect(mockTrigger).toHaveBeenCalledWith('price_min');
  });

  it('should display error message when present', () => {
    mockFormReturn = {
      control: {},
      handleSubmit: vi.fn(),
      trigger: vi.fn(),
      reset: vi.fn(),
      formState: { errors: { price_min: { message: 'Invalid price' } } },
    };

    render(<AsideFilter categories={mockCategories} />);
    expect(screen.getByText('Invalid price')).toBeInTheDocument();
  });
});
