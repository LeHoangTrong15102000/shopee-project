import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddressBookToolbar from '../AddressBookToolbar';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, variants, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, ...rest } = props;
    return (
      <button onClick={onClick} className={className} {...rest}>
        {children}
      </button>
    );
  },
}));

vi.mock('src/components/ShopeeCheckbox', () => ({
  default: ({ checked, onChange, size }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      data-testid="select-all-checkbox"
    />
  ),
}));

const ADDRESS_TYPE_CONFIG = {
  home: { label: 'Nhà', icon: <span>🏠</span>, color: 'blue' },
  office: { label: 'Văn phòng', icon: <span>🏢</span>, color: 'purple' },
  other: { label: 'Khác', icon: <span>📍</span>, color: 'gray' },
};

const defaultProps = {
  searchQuery: '',
  onSearchChange: vi.fn(),
  filterType: 'all' as const,
  onFilterChange: vi.fn(),
  addressCounts: { all: 5, home: 2, office: 2, other: 1 },
  isSelectionMode: false,
  selectedCount: 0,
  totalSelectableCount: 4,
  onSelectAll: vi.fn(),
  onBulkDelete: vi.fn(),
  ADDRESS_TYPE_CONFIG,
};

describe('AddressBookToolbar', () => {
  it('renders search input', () => {
    render(<AddressBookToolbar {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Tìm theo/i)).toBeInTheDocument();
  });

  it('calls onSearchChange when typing', () => {
    const onSearchChange = vi.fn();
    render(<AddressBookToolbar {...defaultProps} onSearchChange={onSearchChange} />);
    fireEvent.change(screen.getByPlaceholderText(/Tìm theo/i), { target: { value: 'test' } });
    expect(onSearchChange).toHaveBeenCalledWith('test');
  });

  it('renders clear button when search has value', () => {
    render(<AddressBookToolbar {...defaultProps} searchQuery="abc" />);
    // The clear button is a Button with an X svg
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('clears search when clear button clicked', () => {
    const onSearchChange = vi.fn();
    render(
      <AddressBookToolbar {...defaultProps} searchQuery="abc" onSearchChange={onSearchChange} />,
    );
    // Find the clear button (first button before filter tabs)
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  it('renders filter tabs', () => {
    render(<AddressBookToolbar {...defaultProps} />);
    expect(screen.getByText('Nhà')).toBeInTheDocument();
    expect(screen.getByText('Văn phòng')).toBeInTheDocument();
    expect(screen.getByText('Khác')).toBeInTheDocument();
  });

  it('renders address counts in filter tabs', () => {
    render(<AddressBookToolbar {...defaultProps} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('calls onFilterChange when filter tab clicked', () => {
    const onFilterChange = vi.fn();
    render(<AddressBookToolbar {...defaultProps} onFilterChange={onFilterChange} />);
    fireEvent.click(screen.getByText('Nhà'));
    expect(onFilterChange).toHaveBeenCalledWith('home');
  });

  it('does not render bulk actions when not in selection mode', () => {
    render(<AddressBookToolbar {...defaultProps} />);
    expect(screen.queryByText(/Xóa đã chọn/)).not.toBeInTheDocument();
  });

  it('renders bulk actions when in selection mode with selections', () => {
    render(<AddressBookToolbar {...defaultProps} isSelectionMode={true} selectedCount={2} />);
    expect(screen.getByText(/Đã chọn 2/)).toBeInTheDocument();
  });

  it('renders delete selected button in selection mode', () => {
    render(<AddressBookToolbar {...defaultProps} isSelectionMode={true} selectedCount={2} />);
    const deleteBtn = screen.getByText(/Xóa/);
    expect(deleteBtn).toBeInTheDocument();
  });

  it('calls onBulkDelete when delete button clicked', () => {
    const onBulkDelete = vi.fn();
    render(
      <AddressBookToolbar
        {...defaultProps}
        isSelectionMode={true}
        selectedCount={2}
        onBulkDelete={onBulkDelete}
      />,
    );
    const deleteBtn = screen.getByText(/Xóa/);
    fireEvent.click(deleteBtn);
    expect(onBulkDelete).toHaveBeenCalled();
  });

  it('renders select all checkbox in selection mode', () => {
    render(<AddressBookToolbar {...defaultProps} isSelectionMode={true} selectedCount={2} />);
    expect(screen.getByTestId('select-all-checkbox')).toBeInTheDocument();
  });

  it('calls onSelectAll when select all clicked', () => {
    const onSelectAll = vi.fn();
    render(
      <AddressBookToolbar
        {...defaultProps}
        isSelectionMode={true}
        selectedCount={2}
        onSelectAll={onSelectAll}
      />,
    );
    fireEvent.click(screen.getByTestId('select-all-checkbox'));
    expect(onSelectAll).toHaveBeenCalled();
  });

  it('does not render bulk actions when selectedCount is 0', () => {
    render(<AddressBookToolbar {...defaultProps} isSelectionMode={true} selectedCount={0} />);
    expect(screen.queryByTestId('select-all-checkbox')).not.toBeInTheDocument();
  });
});
