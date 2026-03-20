import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from '../SearchBar';

// Mock dependencies
vi.mock('src/components/Header/SearchSuggestions', () => ({
  default: ({ isVisible, onSelectSuggestion, onHide }: any) =>
    isVisible ? (
      <div data-testid="search-suggestions">
        <button onClick={() => onSelectSuggestion('laptop')}>laptop</button>
        <button onClick={onHide}>Hide</button>
      </div>
    ) : null,
}));

vi.mock('src/components/SearchHistory', () => ({
  default: ({ history, onSelect, onRemove, onClearAll }: any) => (
    <div data-testid="search-history">
      {history.map((item: string) => (
        <button key={item} onClick={() => onSelect(item)}>
          {item}
        </button>
      ))}
      <button onClick={() => onRemove('test')}>Remove</button>
      <button onClick={onClearAll}>Clear All</button>
    </div>
  ),
}));

const mockAddToHistory = vi.fn();
const mockRemoveFromHistory = vi.fn();
const mockClearHistory = vi.fn();

vi.mock('src/hooks/useSearchHistory', () => ({
  default: () => ({
    searchHistory: ['phone', 'tablet'],
    addToHistory: mockAddToHistory,
    removeFromHistory: mockRemoveFromHistory,
    clearHistory: mockClearHistory,
  }),
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));

describe('SearchBar', () => {
  const mockSetFilters = vi.fn() as any;
  const defaultProps = {
    filters: {
      page: 1,
      limit: 20,
      name: '',
      order: null,
      sort_by: 'createdAt' as const,
      exclude: null,
      price_min: null,
      price_max: null,
      rating_filter: null,
      category: null,
    },
    setFilters: mockSetFilters,
  };

  const createProps = (overrides: Partial<typeof defaultProps.filters>) => ({
    filters: { ...defaultProps.filters, ...overrides },
    setFilters: mockSetFilters,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders search input and submit button', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    const submitButton = screen.getByRole('button', { name: '' });

    expect(input).toBeTruthy();
    expect(submitButton).toBeTruthy();
  });

  it('updates search value when typing', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(input.value).toBe('laptop');
  });

  it('shows suggestions when typing non-empty value', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(screen.getByTestId('search-suggestions')).toBeTruthy();
  });

  it('shows search history when input is focused with empty value', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.focus(input);

    expect(screen.getByTestId('search-history')).toBeTruthy();
  });

  it('hides suggestions and shows history when clearing input', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');

    // Type something
    fireEvent.change(input, { target: { value: 'laptop' } });
    expect(screen.getByTestId('search-suggestions')).toBeTruthy();

    // Clear input
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByTestId('search-suggestions')).toBeFalsy();
    expect(screen.getByTestId('search-history')).toBeTruthy();
  });

  it('submits search on form submit', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'laptop' } });
    fireEvent.submit(form);

    expect(mockAddToHistory).toHaveBeenCalledWith('laptop');
    expect(mockSetFilters).toHaveBeenCalledWith({ name: 'laptop' });
  });

  it('does not submit empty search', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    const form = input.closest('form')!;

    fireEvent.submit(form);

    expect(mockAddToHistory).not.toHaveBeenCalled();
    expect(mockSetFilters).not.toHaveBeenCalled();
  });

  it('trims whitespace before submitting', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: '  laptop  ' } });
    fireEvent.submit(form);

    expect(mockAddToHistory).toHaveBeenCalledWith('laptop');
    expect(mockSetFilters).toHaveBeenCalledWith({ name: 'laptop' });
  });

  it('resets order filter when submitting with existing order', () => {
    const propsWithOrder = {
      filters: {
        ...defaultProps.filters,
        name: '',
        order: 'asc' as const,
        sort_by: 'price' as const,
      },
      setFilters: mockSetFilters,
    };

    render(<SearchBar {...propsWithOrder} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'laptop' } });
    fireEvent.submit(form);

    expect(mockSetFilters).toHaveBeenCalledWith({
      name: 'laptop',
      order: null,
      sort_by: 'createdAt',
    });
  });

  it('handles suggestion selection', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'lap' } });

    const suggestionButton = screen.getByText('laptop');
    fireEvent.click(suggestionButton);

    expect(mockAddToHistory).toHaveBeenCalledWith('laptop');
    expect(mockSetFilters).toHaveBeenCalledWith({ name: 'laptop' });
  });

  it('handles history item selection', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.focus(input);

    const historyButton = screen.getByText('phone');
    fireEvent.click(historyButton);

    expect(mockAddToHistory).toHaveBeenCalledWith('phone');
    expect(mockSetFilters).toHaveBeenCalledWith({ name: 'phone' });
  });

  it('handles history item removal', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.focus(input);

    const removeButton = screen.getByText('Remove');
    fireEvent.click(removeButton);

    expect(mockRemoveFromHistory).toHaveBeenCalledWith('test');
  });

  it('handles clear all history', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.focus(input);

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    expect(mockClearHistory).toHaveBeenCalled();
  });

  it('hides suggestions when hide button is clicked', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(screen.getByTestId('search-suggestions')).toBeTruthy();

    const hideButton = screen.getByText('Hide');
    fireEvent.click(hideButton);

    expect(screen.queryByTestId('search-suggestions')).toBeFalsy();
  });

  it('closes suggestions on Escape key', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(screen.getByTestId('search-suggestions')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByTestId('search-suggestions')).toBeFalsy();
  });

  it('closes suggestions on click outside', () => {
    render(
      <div>
        <SearchBar {...defaultProps} />
        <div data-testid="outside">Outside</div>
      </div>,
    );

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(screen.getByTestId('search-suggestions')).toBeTruthy();

    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    expect(screen.queryByTestId('search-suggestions')).toBeFalsy();
  });

  it('initializes search value from filters.name', () => {
    const propsWithName = {
      filters: { ...defaultProps.filters, name: 'phone' },
      setFilters: mockSetFilters,
    };

    render(<SearchBar {...propsWithName} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm') as HTMLInputElement;
    expect(input.value).toBe('phone');
  });

  it('updates search value when filters.name changes', () => {
    const { rerender } = render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm') as HTMLInputElement;
    expect(input.value).toBe('');

    const updatedProps = {
      filters: { ...defaultProps.filters, name: 'tablet' },
      setFilters: mockSetFilters,
    };

    rerender(<SearchBar {...updatedProps} />);
    expect(input.value).toBe('tablet');
  });

  it('handles blur event with delay', async () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(screen.getByTestId('search-suggestions')).toBeTruthy();

    fireEvent.blur(input);

    // Suggestions should still be visible immediately after blur
    expect(screen.getByTestId('search-suggestions')).toBeTruthy();

    // Wait for the timeout (150ms)
    await waitFor(
      () => {
        expect(screen.queryByTestId('search-suggestions')).toBeFalsy();
      },
      { timeout: 200 },
    );
  });

  it('shows suggestions when focusing with non-empty value', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');

    // Type something
    fireEvent.change(input, { target: { value: 'laptop' } });

    // Blur to hide suggestions
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('search-suggestions')).toBeFalsy();

    // Focus again
    fireEvent.focus(input);
    expect(screen.getByTestId('search-suggestions')).toBeTruthy();
  });

  it('does not show history when input has value', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(screen.queryByTestId('search-history')).toBeFalsy();
  });

  it('handles whitespace-only input as empty', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(form);

    expect(mockAddToHistory).not.toHaveBeenCalled();
    expect(mockSetFilters).not.toHaveBeenCalled();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('does not close suggestions on blur if focus remains within container', async () => {
    const { container } = render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(screen.getByTestId('search-suggestions')).toBeTruthy();

    // Mock activeElement to be within the search container
    const searchContainer = container.querySelector('[class*="relative"]');
    Object.defineProperty(document, 'activeElement', {
      writable: true,
      configurable: true,
      value: searchContainer,
    });

    fireEvent.blur(input);

    // Wait for the timeout
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Suggestions should still be visible
    expect(screen.getByTestId('search-suggestions')).toBeTruthy();
  });

  it('does not add event listeners when suggestions and history are hidden', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const initialCallCount = addEventListenerSpy.mock.calls.length;

    render(<SearchBar {...defaultProps} />);

    // No suggestions or history shown initially
    expect(addEventListenerSpy.mock.calls.length).toBe(initialCallCount);
  });

  it('handles clicking inside search container', () => {
    const { container } = render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(screen.getByTestId('search-suggestions')).toBeTruthy();

    // Click inside the container
    const searchContainer = container.querySelector('[class*="relative"]')!;
    fireEvent.mouseDown(searchContainer);

    // Suggestions should still be visible
    expect(screen.getByTestId('search-suggestions')).toBeTruthy();
  });

  it('handles non-Escape key press', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    fireEvent.change(input, { target: { value: 'laptop' } });

    expect(screen.getByTestId('search-suggestions')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Enter' });

    // Suggestions should still be visible
    expect(screen.getByTestId('search-suggestions')).toBeTruthy();
  });

  it('submits search without order when filters.order is null', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm');
    const form = input.closest('form')!;

    fireEvent.change(input, { target: { value: 'laptop' } });
    fireEvent.submit(form);

    expect(mockSetFilters).toHaveBeenCalledWith({ name: 'laptop' });
  });

  it('handles empty filters.name on mount', () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByPlaceholderText('Tìm kiếm sản phẩm') as HTMLInputElement;
    expect(input.value).toBe('');
  });
});
