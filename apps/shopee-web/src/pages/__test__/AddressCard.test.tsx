import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddressCard from '../User/pages/AddressBook/components/AddressCard';
import { Address, AddressType } from 'src/types/checkout.type';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
}));

// Mock Button component
vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>
      {children}
    </button>
  ),
}));

// Mock ShopeeCheckbox component
vi.mock('src/components/ShopeeCheckbox', () => ({
  default: ({ checked, onChange, size }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      data-size={size}
      data-testid="shopee-checkbox"
    />
  ),
}));

describe('AddressCard', () => {
  const mockAddress: Address = {
    _id: 'addr-123',
    fullName: 'John Doe',
    phone: '0123456789',
    specificAddress: '123 Main St',
    ward: 'Ward 1',
    district: 'District 1',
    province: 'Ho Chi Minh',
    addressType: 'home' as AddressType,
    label: '',
  };

  const mockFormatAddress = vi.fn((address: Address) => {
    return `${address.specificAddress}, ${address.ward}, ${address.district}, ${address.province}`;
  });

  const mockGetAddressTypeInfo = vi.fn((type?: AddressType) => {
    const typeMap = {
      home: {
        label: 'Nhà riêng',
        icon: <svg data-testid="home-icon" />,
        color: 'blue',
      },
      office: {
        label: 'Văn phòng',
        icon: <svg data-testid="office-icon" />,
        color: 'purple',
      },
      other: {
        label: 'Khác',
        icon: <svg data-testid="other-icon" />,
        color: 'gray',
      },
    };
    return typeMap[type || 'home'];
  });

  const defaultProps = {
    address: mockAddress,
    isDefault: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSetDefault: vi.fn(),
    formatAddress: mockFormatAddress,
    getAddressTypeInfo: mockGetAddressTypeInfo,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders address info (name, phone, formatted address)', () => {
    render(<AddressCard {...defaultProps} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('0123456789')).toBeInTheDocument();
    expect(screen.getByText('123 Main St, Ward 1, District 1, Ho Chi Minh')).toBeInTheDocument();
    expect(mockFormatAddress).toHaveBeenCalledWith(mockAddress);
  });

  it('shows default badge when isDefault is true', () => {
    render(<AddressCard {...defaultProps} isDefault={true} />);

    expect(screen.getByText('Mặc định')).toBeInTheDocument();
    expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument();
  });

  it('does not show default badge when isDefault is false', () => {
    render(<AddressCard {...defaultProps} isDefault={false} />);

    expect(screen.queryByText('Mặc định')).not.toBeInTheDocument();
    expect(screen.queryByText('Địa chỉ giao hàng')).not.toBeInTheDocument();
  });

  it('shows checkbox in selection mode when not default', () => {
    render(
      <AddressCard
        {...defaultProps}
        isSelectionMode={true}
        isSelected={false}
        onToggleSelect={vi.fn()}
      />,
    );

    const checkbox = screen.getByTestId('shopee-checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).toHaveAttribute('data-size', 'sm');
  });

  it('hides checkbox when not in selection mode', () => {
    render(<AddressCard {...defaultProps} isSelectionMode={false} />);

    expect(screen.queryByTestId('shopee-checkbox')).not.toBeInTheDocument();
  });

  it('shows drag handle when not in selection mode and not default', () => {
    const { container } = render(
      <AddressCard {...defaultProps} isSelectionMode={false} isDefault={false} />,
    );

    // Drag handle is an SVG with specific viewBox
    const dragHandle = container.querySelector('svg[viewBox="0 0 20 20"]');
    expect(dragHandle).toBeInTheDocument();
  });

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn();
    render(<AddressCard {...defaultProps} onEdit={onEdit} />);

    const editButton = screen.getByText('Sửa').closest('button');
    fireEvent.click(editButton!);

    expect(onEdit).toHaveBeenCalledWith(mockAddress);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<AddressCard {...defaultProps} onDelete={onDelete} isDefault={false} />);

    const deleteButton = screen.getByText('Xóa').closest('button');
    fireEvent.click(deleteButton!);

    expect(onDelete).toHaveBeenCalledWith('addr-123');
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('calls onSetDefault when set default button clicked', () => {
    const onSetDefault = vi.fn();
    render(<AddressCard {...defaultProps} onSetDefault={onSetDefault} isDefault={false} />);

    const setDefaultButton = screen.getByText('Đặt mặc định').closest('button');
    fireEvent.click(setDefaultButton!);

    expect(onSetDefault).toHaveBeenCalledWith('addr-123');
    expect(onSetDefault).toHaveBeenCalledTimes(1);
  });

  it('hides delete/set-default buttons for default address', () => {
    render(<AddressCard {...defaultProps} isDefault={true} />);

    expect(screen.queryByText('Xóa')).not.toBeInTheDocument();
    expect(screen.queryByText('Đặt mặc định')).not.toBeInTheDocument();
    // Edit button should still be visible
    expect(screen.getByText('Sửa')).toBeInTheDocument();
  });

  it('shows custom label for "other" address type with label', () => {
    const addressWithCustomLabel: Address = {
      ...mockAddress,
      addressType: 'other' as AddressType,
      label: 'My Custom Place',
    };

    render(<AddressCard {...defaultProps} address={addressWithCustomLabel} />);

    expect(screen.getByText('My Custom Place')).toBeInTheDocument();
  });

  it('calls onToggleSelect when checkbox clicked', () => {
    const onToggleSelect = vi.fn();
    render(
      <AddressCard
        {...defaultProps}
        isSelectionMode={true}
        isSelected={false}
        onToggleSelect={onToggleSelect}
      />,
    );

    const checkbox = screen.getByTestId('shopee-checkbox');
    fireEvent.click(checkbox);

    expect(onToggleSelect).toHaveBeenCalledWith('addr-123');
    expect(onToggleSelect).toHaveBeenCalledTimes(1);
  });

  it('selected styling when isSelected is true', () => {
    const { container } = render(
      <AddressCard
        {...defaultProps}
        isSelectionMode={true}
        isSelected={true}
        onToggleSelect={vi.fn()}
      />,
    );

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-orange');
    expect(card.className).toContain('bg-orange/5');
    expect(card.className).toContain('ring-2');
  });

  it('address type icon and color rendering', () => {
    // Test home type (blue)
    const { rerender } = render(<AddressCard {...defaultProps} />);
    expect(screen.getAllByTestId('home-icon').length).toBeGreaterThan(0);
    expect(mockGetAddressTypeInfo).toHaveBeenCalledWith('home');

    // Test office type (purple)
    const officeAddress = { ...mockAddress, addressType: 'office' as AddressType };
    rerender(<AddressCard {...defaultProps} address={officeAddress} />);
    expect(screen.getAllByTestId('office-icon').length).toBeGreaterThan(0);
    expect(mockGetAddressTypeInfo).toHaveBeenCalledWith('office');

    // Test other type (gray)
    const otherAddress = { ...mockAddress, addressType: 'other' as AddressType };
    rerender(<AddressCard {...defaultProps} address={otherAddress} />);
    expect(screen.getAllByTestId('other-icon').length).toBeGreaterThan(0);
    expect(mockGetAddressTypeInfo).toHaveBeenCalledWith('other');
  });

  it('hides action buttons in selection mode', () => {
    render(<AddressCard {...defaultProps} isSelectionMode={true} onToggleSelect={vi.fn()} />);

    expect(screen.queryByText('Sửa')).not.toBeInTheDocument();
    expect(screen.queryByText('Xóa')).not.toBeInTheDocument();
    expect(screen.queryByText('Đặt mặc định')).not.toBeInTheDocument();
  });

  it('does not show checkbox for default address in selection mode', () => {
    render(
      <AddressCard
        {...defaultProps}
        isDefault={true}
        isSelectionMode={true}
        onToggleSelect={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('shopee-checkbox')).not.toBeInTheDocument();
  });

  it('checkbox is checked when isSelected is true', () => {
    render(
      <AddressCard
        {...defaultProps}
        isSelectionMode={true}
        isSelected={true}
        onToggleSelect={vi.fn()}
      />,
    );

    const checkbox = screen.getByTestId('shopee-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('checkbox is unchecked when isSelected is false', () => {
    render(
      <AddressCard
        {...defaultProps}
        isSelectionMode={true}
        isSelected={false}
        onToggleSelect={vi.fn()}
      />,
    );

    const checkbox = screen.getByTestId('shopee-checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });
});
