import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveFilterChips from '../ActiveFilterChips';

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, ariaLabel, animated, variant, ...props }: any) => (
    <button onClick={onClick} aria-label={ariaLabel} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('src/utils/utils', () => ({
  formatCurrency: (n: number) => n.toLocaleString(),
}));

vi.mock('../../orderSearchFilter.constants', () => ({
  chipVariants: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
}));

describe('ActiveFilterChips', () => {
  const defaultProps = {
    reducedMotion: true,
    searchQuery: '',
    dateRange: null,
    priceRange: null,
    hasSearchFilter: false,
    hasDateFilter: false,
    hasPriceFilter: false,
    hasAnyFilter: false,
    onClearSearch: vi.fn(),
    onClearDateRange: vi.fn(),
    onClearPriceRange: vi.fn(),
    onClearAllFilters: vi.fn(),
  };

  it('renders total results when provided', () => {
    render(<ActiveFilterChips {...defaultProps} totalResults={42} />);
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('does not render total results when undefined', () => {
    render(<ActiveFilterChips {...defaultProps} />);
    expect(screen.queryByText(/đơn hàng/)).not.toBeInTheDocument();
  });

  it('renders search chip when hasSearchFilter', () => {
    render(<ActiveFilterChips {...defaultProps} hasSearchFilter={true} searchQuery="test query" />);
    expect(screen.getByText(/"test query"/)).toBeInTheDocument();
  });

  it('calls onClearSearch when search chip close clicked', () => {
    const onClearSearch = vi.fn();
    render(
      <ActiveFilterChips
        {...defaultProps}
        hasSearchFilter={true}
        searchQuery="test"
        onClearSearch={onClearSearch}
      />,
    );
    fireEvent.click(screen.getByLabelText('Xóa bộ lọc tìm kiếm'));
    expect(onClearSearch).toHaveBeenCalled();
  });

  it('renders date chip when hasDateFilter', () => {
    render(
      <ActiveFilterChips
        {...defaultProps}
        hasDateFilter={true}
        dateRange={{ from: '01/01/2024', to: '31/01/2024' }}
      />,
    );
    expect(screen.getByText(/01\/01\/2024/)).toBeInTheDocument();
  });

  it('calls onClearDateRange when date chip close clicked', () => {
    const onClearDateRange = vi.fn();
    render(
      <ActiveFilterChips
        {...defaultProps}
        hasDateFilter={true}
        dateRange={{ from: '01/01/2024', to: '31/01/2024' }}
        onClearDateRange={onClearDateRange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Xóa bộ lọc ngày'));
    expect(onClearDateRange).toHaveBeenCalled();
  });

  it('renders price chip when hasPriceFilter', () => {
    render(
      <ActiveFilterChips
        {...defaultProps}
        hasPriceFilter={true}
        priceRange={{ min: 100000, max: 500000 }}
      />,
    );
    expect(screen.getByText(/100,000/)).toBeInTheDocument();
  });

  it('calls onClearPriceRange when price chip close clicked', () => {
    const onClearPriceRange = vi.fn();
    render(
      <ActiveFilterChips
        {...defaultProps}
        hasPriceFilter={true}
        priceRange={{ min: 100000, max: 500000 }}
        onClearPriceRange={onClearPriceRange}
      />,
    );
    fireEvent.click(screen.getByLabelText('Xóa bộ lọc giá'));
    expect(onClearPriceRange).toHaveBeenCalled();
  });

  it('renders clear all button when hasAnyFilter', () => {
    render(<ActiveFilterChips {...defaultProps} hasAnyFilter={true} />);
    expect(screen.getByText('Xóa tất cả bộ lọc')).toBeInTheDocument();
  });

  it('does not render clear all button when no filters', () => {
    render(<ActiveFilterChips {...defaultProps} hasAnyFilter={false} />);
    expect(screen.queryByText('Xóa tất cả bộ lọc')).not.toBeInTheDocument();
  });

  it('calls onClearAllFilters when clear all clicked', () => {
    const onClearAllFilters = vi.fn();
    render(
      <ActiveFilterChips
        {...defaultProps}
        hasAnyFilter={true}
        onClearAllFilters={onClearAllFilters}
      />,
    );
    fireEvent.click(screen.getByText('Xóa tất cả bộ lọc'));
    expect(onClearAllFilters).toHaveBeenCalled();
  });

  it('renders all chips simultaneously', () => {
    render(
      <ActiveFilterChips
        {...defaultProps}
        hasSearchFilter={true}
        searchQuery="phone"
        hasDateFilter={true}
        dateRange={{ from: '01/01', to: '31/01' }}
        hasPriceFilter={true}
        priceRange={{ min: 0, max: 1000 }}
        hasAnyFilter={true}
      />,
    );
    expect(screen.getByText(/"phone"/)).toBeInTheDocument();
    expect(screen.getByText(/01\/01/)).toBeInTheDocument();
    expect(screen.getByText('Xóa tất cả bộ lọc')).toBeInTheDocument();
  });
});
