import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterState } from '../useFilterState';

describe('useFilterState', () => {
  const mockOnSearchChange = vi.fn();
  const mockOnDateRangeChange = vi.fn();
  const mockOnPriceRangeChange = vi.fn();
  const mockOnClearAll = vi.fn();

  const defaultProps = {
    searchQuery: '',
    onSearchChange: mockOnSearchChange,
    dateRange: null as { from: string; to: string } | null,
    onDateRangeChange: mockOnDateRangeChange,
    priceRange: null as { min: number; max: number } | null,
    onPriceRangeChange: mockOnPriceRangeChange,
    onClearAll: mockOnClearAll,
    activeFilterCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    expect(result.current.inputValue).toBe('');
    expect(result.current.isFilterPanelOpen).toBe(false);
    expect(result.current.dateFrom).toBe('');
    expect(result.current.dateTo).toBe('');
    expect(result.current.priceMin).toBe('');
    expect(result.current.priceMax).toBe('');
    expect(result.current.hasSearchFilter).toBe(false);
    expect(result.current.hasDateFilter).toBe(false);
    expect(result.current.hasPriceFilter).toBe(false);
    expect(result.current.hasAnyFilter).toBe(false);
  });

  it('should sync inputValue with searchQuery prop', () => {
    const { result, rerender } = renderHook((props) => useFilterState(props), {
      initialProps: defaultProps,
    });

    expect(result.current.inputValue).toBe('');

    rerender({ ...defaultProps, searchQuery: 'test query' });

    expect(result.current.inputValue).toBe('test query');
  });

  it('should sync date fields with dateRange prop', () => {
    const { result, rerender } = renderHook((props) => useFilterState(props), {
      initialProps: defaultProps,
    });

    expect(result.current.dateFrom).toBe('');
    expect(result.current.dateTo).toBe('');

    rerender({
      ...defaultProps,
      dateRange: { from: '2024-01-01', to: '2024-01-31' },
    });

    expect(result.current.dateFrom).toBe('2024-01-01');
    expect(result.current.dateTo).toBe('2024-01-31');
  });

  it('should sync price fields with priceRange prop', () => {
    const { result, rerender } = renderHook((props) => useFilterState(props), {
      initialProps: defaultProps,
    });

    expect(result.current.priceMin).toBe('');
    expect(result.current.priceMax).toBe('');

    rerender({
      ...defaultProps,
      priceRange: { min: 100, max: 500 },
    });

    expect(result.current.priceMin).toBe('100');
    expect(result.current.priceMax).toBe('500');
  });

  it('should handle input change', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleInputChange({
        target: { value: 'new search' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.inputValue).toBe('new search');
  });

  it('should debounce search query changes', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleInputChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockOnSearchChange).toHaveBeenCalledWith('test');
  });

  it('should not call onSearchChange if value unchanged', () => {
    const { result } = renderHook(() => useFilterState({ ...defaultProps, searchQuery: 'test' }));

    act(() => {
      result.current.handleInputChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockOnSearchChange).not.toHaveBeenCalled();
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleInputChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleClearSearch();
    });

    expect(result.current.inputValue).toBe('');
    expect(mockOnSearchChange).toHaveBeenCalledWith('');
  });

  it('should handle date from change', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleDateFromChange({
        target: { value: '2024-01-01' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.dateFrom).toBe('2024-01-01');
    expect(mockOnDateRangeChange).not.toHaveBeenCalled();
  });

  it('should call onDateRangeChange when both dates are set', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleDateFromChange({
        target: { value: '2024-01-01' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handleDateToChange({
        target: { value: '2024-01-31' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnDateRangeChange).toHaveBeenCalledWith({
      from: '2024-01-01',
      to: '2024-01-31',
    });
  });

  it('should handle date to change', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleDateToChange({
        target: { value: '2024-01-31' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.dateTo).toBe('2024-01-31');
  });

  it('should clear date range', () => {
    const { result } = renderHook(() =>
      useFilterState({
        ...defaultProps,
        dateRange: { from: '2024-01-01', to: '2024-01-31' },
      }),
    );

    act(() => {
      result.current.handleClearDateRange();
    });

    expect(mockOnDateRangeChange).toHaveBeenCalledWith(null);
  });

  it('should handle price min change', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '100' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.priceMin).toBe('100');
  });

  it('should call onPriceRangeChange when both prices are valid numbers', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '100' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '500' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({ min: 100, max: 500 });
  });

  it('should not call onPriceRangeChange when only one price is set', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '100' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnPriceRangeChange).not.toHaveBeenCalled();
  });

  it('should handle price max change', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '500' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.priceMax).toBe('500');
  });

  it('should clear price range', () => {
    const { result } = renderHook(() =>
      useFilterState({
        ...defaultProps,
        priceRange: { min: 100, max: 500 },
      }),
    );

    act(() => {
      result.current.handleClearPriceRange();
    });

    expect(mockOnPriceRangeChange).toHaveBeenCalledWith(null);
  });

  it('should clear all filters', () => {
    const { result } = renderHook(() =>
      useFilterState({
        ...defaultProps,
        searchQuery: 'test',
        dateRange: { from: '2024-01-01', to: '2024-01-31' },
        priceRange: { min: 100, max: 500 },
      }),
    );

    act(() => {
      result.current.handleClearAllFilters();
    });

    expect(mockOnClearAll).toHaveBeenCalled();
  });

  it('should toggle filter panel', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    expect(result.current.isFilterPanelOpen).toBe(false);

    act(() => {
      result.current.toggleFilterPanel();
    });

    expect(result.current.isFilterPanelOpen).toBe(true);

    act(() => {
      result.current.toggleFilterPanel();
    });

    expect(result.current.isFilterPanelOpen).toBe(false);
  });

  it('should calculate hasSearchFilter correctly', () => {
    const { result, rerender } = renderHook((props) => useFilterState(props), {
      initialProps: defaultProps,
    });

    expect(result.current.hasSearchFilter).toBe(false);

    rerender({ ...defaultProps, searchQuery: 'test' });

    expect(result.current.hasSearchFilter).toBe(true);

    rerender({ ...defaultProps, searchQuery: '   ' });

    expect(result.current.hasSearchFilter).toBe(false);
  });

  it('should calculate hasDateFilter correctly', () => {
    const { result, rerender } = renderHook((props) => useFilterState(props), {
      initialProps: defaultProps,
    });

    expect(result.current.hasDateFilter).toBe(false);

    rerender({
      ...defaultProps,
      dateRange: { from: '2024-01-01', to: '2024-01-31' },
    });

    expect(result.current.hasDateFilter).toBe(true);
  });

  it('should calculate hasPriceFilter correctly', () => {
    const { result, rerender } = renderHook((props) => useFilterState(props), {
      initialProps: defaultProps,
    });

    expect(result.current.hasPriceFilter).toBe(false);

    rerender({
      ...defaultProps,
      priceRange: { min: 100, max: 500 },
    });

    expect(result.current.hasPriceFilter).toBe(true);
  });

  it('should calculate hasAnyFilter correctly', () => {
    const { result, rerender } = renderHook((props) => useFilterState(props), {
      initialProps: defaultProps,
    });

    expect(result.current.hasAnyFilter).toBe(false);

    rerender({ ...defaultProps, activeFilterCount: 1 });

    expect(result.current.hasAnyFilter).toBe(true);

    rerender({ ...defaultProps, activeFilterCount: 3 });

    expect(result.current.hasAnyFilter).toBe(true);
  });

  it('should handle invalid price input', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handlePriceMinChange({
        target: { value: 'abc' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.priceMin).toBe('abc');
    expect(mockOnPriceRangeChange).not.toHaveBeenCalled();
  });

  it('should handle decimal price values', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '99.99' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '199.99' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({ min: 99.99, max: 199.99 });
  });

  it('should not call onDateRangeChange when only dateFrom is set', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleDateFromChange({
        target: { value: '2024-01-01' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnDateRangeChange).not.toHaveBeenCalled();
  });

  it('should not call onDateRangeChange when only dateTo is set', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleDateToChange({
        target: { value: '2024-01-31' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnDateRangeChange).not.toHaveBeenCalled();
  });

  it('should handle clearing dateTo when dateFrom is set', () => {
    const { result } = renderHook(() =>
      useFilterState({
        ...defaultProps,
        dateRange: { from: '2024-01-01', to: '2024-01-31' },
      }),
    );

    act(() => {
      result.current.handleDateToChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should not call onDateRangeChange because dateFrom is still set
    expect(mockOnDateRangeChange).not.toHaveBeenCalled();
  });

  it('should handle clearing dateFrom when dateTo is set', () => {
    const { result } = renderHook(() =>
      useFilterState({
        ...defaultProps,
        dateRange: { from: '2024-01-01', to: '2024-01-31' },
      }),
    );

    act(() => {
      result.current.handleDateFromChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should not call onDateRangeChange because dateTo is still set
    expect(mockOnDateRangeChange).not.toHaveBeenCalled();
  });

  it('should handle clearing priceMax when priceMin is set', () => {
    const { result } = renderHook(() =>
      useFilterState({
        ...defaultProps,
        priceRange: { min: 100, max: 500 },
      }),
    );

    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should not call onPriceRangeChange because priceMin is still set
    expect(mockOnPriceRangeChange).not.toHaveBeenCalled();
  });

  it('should handle clearing priceMin when priceMax is set', () => {
    const { result } = renderHook(() =>
      useFilterState({
        ...defaultProps,
        priceRange: { min: 100, max: 500 },
      }),
    );

    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    // Should not call onPriceRangeChange because priceMax is still set
    expect(mockOnPriceRangeChange).not.toHaveBeenCalled();
  });

  it('should cleanup debounce timer on unmount', () => {
    const { result, unmount } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleInputChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockOnSearchChange).not.toHaveBeenCalled();
  });

  it('should handle rapid input changes with debounce', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handleInputChange({
        target: { value: 't' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.handleInputChange({
        target: { value: 'te' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    act(() => {
      result.current.handleInputChange({
        target: { value: 'test' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnSearchChange).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockOnSearchChange).toHaveBeenCalledTimes(1);
    expect(mockOnSearchChange).toHaveBeenCalledWith('test');
  });

  it('should call onDateRangeChange with null when clearing dateTo and dateFrom is empty', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    // First set dateTo
    act(() => {
      result.current.handleDateToChange({
        target: { value: '2024-01-31' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    vi.clearAllMocks();

    // Then clear dateTo - should call with null since dateFrom is empty
    act(() => {
      result.current.handleDateToChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnDateRangeChange).toHaveBeenCalledWith(null);
  });

  it('should call onDateRangeChange with null when clearing dateFrom and dateTo is empty', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    // First set dateFrom
    act(() => {
      result.current.handleDateFromChange({
        target: { value: '2024-01-01' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    vi.clearAllMocks();

    // Then clear dateFrom - should call with null since dateTo is empty
    act(() => {
      result.current.handleDateFromChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnDateRangeChange).toHaveBeenCalledWith(null);
  });

  it('should call onPriceRangeChange with null when clearing priceMax and priceMin is empty', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    // First set priceMax
    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '500' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    vi.clearAllMocks();

    // Then clear priceMax - should call with null since priceMin is empty
    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnPriceRangeChange).toHaveBeenCalledWith(null);
  });

  it('should call onPriceRangeChange with null when clearing priceMin and priceMax is empty', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    // First set priceMin
    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '100' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    vi.clearAllMocks();

    // Then clear priceMin - should call with null since priceMax is empty
    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnPriceRangeChange).toHaveBeenCalledWith(null);
  });

  it('should update dateFrom when dateTo exists and call onDateRangeChange', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    // First set dateTo
    act(() => {
      result.current.handleDateToChange({
        target: { value: '2024-12-31' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    vi.clearAllMocks();

    // Then set dateFrom - should call onDateRangeChange
    act(() => {
      result.current.handleDateFromChange({
        target: { value: '2024-01-01' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.dateFrom).toBe('2024-01-01');
    expect(mockOnDateRangeChange).toHaveBeenCalledWith({
      from: '2024-01-01',
      to: '2024-12-31',
    });
  });

  it('should update dateTo when dateFrom exists and call onDateRangeChange', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    // First set dateFrom
    act(() => {
      result.current.handleDateFromChange({
        target: { value: '2024-01-01' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    vi.clearAllMocks();

    // Then set dateTo - should call onDateRangeChange
    act(() => {
      result.current.handleDateToChange({
        target: { value: '2024-12-31' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.dateTo).toBe('2024-12-31');
    expect(mockOnDateRangeChange).toHaveBeenCalledWith({
      from: '2024-01-01',
      to: '2024-12-31',
    });
  });

  it('should update priceMin when priceMax exists and call onPriceRangeChange', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    // First set priceMax
    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '500' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    vi.clearAllMocks();

    // Then set priceMin - should call onPriceRangeChange
    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '100' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.priceMin).toBe('100');
    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({
      min: 100,
      max: 500,
    });
  });

  it('should update priceMax when priceMin exists and call onPriceRangeChange', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    // First set priceMin
    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '100' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    vi.clearAllMocks();

    // Then set priceMax - should call onPriceRangeChange
    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '500' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.priceMax).toBe('500');
    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({
      min: 100,
      max: 500,
    });
  });

  it('should handle zero values in price range', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '0' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '0' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({ min: 0, max: 0 });
  });

  it('should handle negative price values', () => {
    const { result } = renderHook(() => useFilterState(defaultProps));

    act(() => {
      result.current.handlePriceMinChange({
        target: { value: '-10' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    act(() => {
      result.current.handlePriceMaxChange({
        target: { value: '100' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(mockOnPriceRangeChange).toHaveBeenCalledWith({ min: -10, max: 100 });
  });

  it('should sync dateRange to empty strings when prop becomes null', () => {
    const { result, rerender } = renderHook((props) => useFilterState(props), {
      initialProps: {
        ...defaultProps,
        dateRange: { from: '2024-01-01', to: '2024-12-31' },
      },
    });

    expect(result.current.dateFrom).toBe('2024-01-01');
    expect(result.current.dateTo).toBe('2024-12-31');

    rerender({ ...defaultProps, dateRange: null as any });

    expect(result.current.dateFrom).toBe('');
    expect(result.current.dateTo).toBe('');
  });

  it('should sync priceRange to empty strings when prop becomes null', () => {
    const { result, rerender } = renderHook((props) => useFilterState(props), {
      initialProps: {
        ...defaultProps,
        priceRange: { min: 100, max: 500 },
      },
    });

    expect(result.current.priceMin).toBe('100');
    expect(result.current.priceMax).toBe('500');

    rerender({ ...defaultProps, priceRange: null as any });

    expect(result.current.priceMin).toBe('');
    expect(result.current.priceMax).toBe('');
  });

  it('should initialize with provided searchQuery', () => {
    const { result } = renderHook(() =>
      useFilterState({ ...defaultProps, searchQuery: 'initial search' }),
    );

    expect(result.current.inputValue).toBe('initial search');
    expect(result.current.hasSearchFilter).toBe(true);
  });

  it('should initialize with provided dateRange', () => {
    const { result } = renderHook(() =>
      useFilterState({
        ...defaultProps,
        dateRange: { from: '2024-01-01', to: '2024-12-31' },
      }),
    );

    expect(result.current.dateFrom).toBe('2024-01-01');
    expect(result.current.dateTo).toBe('2024-12-31');
    expect(result.current.hasDateFilter).toBe(true);
  });

  it('should initialize with provided priceRange', () => {
    const { result } = renderHook(() =>
      useFilterState({
        ...defaultProps,
        priceRange: { min: 100, max: 500 },
      }),
    );

    expect(result.current.priceMin).toBe('100');
    expect(result.current.priceMax).toBe('500');
    expect(result.current.hasPriceFilter).toBe(true);
  });
});
