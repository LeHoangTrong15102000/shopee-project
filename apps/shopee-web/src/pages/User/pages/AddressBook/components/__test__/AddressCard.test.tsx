import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddressCard from '../AddressCard';
import type { Address } from 'src/types/checkout.type';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, whileHover, layout, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
}));

vi.mock('src/components/Button', () => ({
  default: ({ children, onClick, className, ...props }: any) => {
    const { animated, variant, size, ariaLabel, ...rest } = props;
    return (
      <button onClick={onClick} className={className} aria-label={ariaLabel} {...rest}>
        {children}
      </button>
    );
  },
}));

vi.mock('src/components/ShopeeCheckbox', () => ({
  default: ({ checked, onChange, size }: any) => (
    <input type="checkbox" checked={checked} onChange={onChange} data-testid="checkbox" />
  ),
}));

const mockAddress: Address = {
  _id: 'addr1',
  userId: 'u1',
  fullName: 'Nguyễn Văn A',
  phone: '0901234567',
  province: 'Hồ Chí Minh',
  district: 'Quận 1',
  ward: 'Phường Bến Nghé',
  street: '123 Lê Lợi',
  isDefault: false,
  addressType: 'home',
  createdAt: '',
  updatedAt: '',
};

const defaultProps = {
  address: mockAddress,
  isDefault: false,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onSetDefault: vi.fn(),
  formatAddress: (addr: Address) =>
    `${addr.street}, ${addr.ward}, ${addr.district}, ${addr.province}`,
  getAddressTypeInfo: (type?: string) => ({
    label: type === 'home' ? 'Nhà' : type === 'office' ? 'Văn phòng' : 'Khác',
    icon: <span>🏠</span>,
    color: type === 'home' ? 'blue' : type === 'office' ? 'purple' : 'gray',
  }),
};

describe('AddressCard', () => {
  it('renders full name', () => {
    render(<AddressCard {...defaultProps} />);
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
  });

  it('renders phone number', () => {
    render(<AddressCard {...defaultProps} />);
    expect(screen.getByText('0901234567')).toBeInTheDocument();
  });

  it('renders formatted address', () => {
    render(<AddressCard {...defaultProps} />);
    expect(screen.getByText(/123 Lê Lợi/)).toBeInTheDocument();
  });

  it('renders address type label', () => {
    render(<AddressCard {...defaultProps} />);
    expect(screen.getByText('Nhà')).toBeInTheDocument();
  });

  it('renders default badge when isDefault', () => {
    render(<AddressCard {...defaultProps} isDefault={true} />);
    expect(screen.getByText('Mặc định')).toBeInTheDocument();
    expect(screen.getByText('Địa chỉ giao hàng')).toBeInTheDocument();
  });

  it('does not render default badge when not default', () => {
    render(<AddressCard {...defaultProps} />);
    expect(screen.queryByText('Mặc định')).not.toBeInTheDocument();
  });

  it('renders set default button when not default', () => {
    render(<AddressCard {...defaultProps} />);
    expect(screen.getByText('Đặt mặc định')).toBeInTheDocument();
  });

  it('does not render set default button when isDefault', () => {
    render(<AddressCard {...defaultProps} isDefault={true} />);
    expect(screen.queryByText('Đặt mặc định')).not.toBeInTheDocument();
  });

  it('calls onSetDefault when set default clicked', () => {
    const onSetDefault = vi.fn();
    render(<AddressCard {...defaultProps} onSetDefault={onSetDefault} />);
    fireEvent.click(screen.getByText('Đặt mặc định'));
    expect(onSetDefault).toHaveBeenCalledWith('addr1');
  });

  it('renders edit button', () => {
    render(<AddressCard {...defaultProps} />);
    expect(screen.getByText('Sửa')).toBeInTheDocument();
  });

  it('calls onEdit when edit clicked', () => {
    const onEdit = vi.fn();
    render(<AddressCard {...defaultProps} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Sửa'));
    expect(onEdit).toHaveBeenCalledWith(mockAddress);
  });

  it('renders delete button when not default', () => {
    render(<AddressCard {...defaultProps} />);
    expect(screen.getByText('Xóa')).toBeInTheDocument();
  });

  it('does not render delete button when isDefault', () => {
    render(<AddressCard {...defaultProps} isDefault={true} />);
    expect(screen.queryByText('Xóa')).not.toBeInTheDocument();
  });

  it('calls onDelete when delete clicked', () => {
    const onDelete = vi.fn();
    render(<AddressCard {...defaultProps} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Xóa'));
    expect(onDelete).toHaveBeenCalledWith('addr1');
  });

  it('hides action buttons in selection mode', () => {
    render(<AddressCard {...defaultProps} isSelectionMode={true} />);
    expect(screen.queryByText('Sửa')).not.toBeInTheDocument();
    expect(screen.queryByText('Xóa')).not.toBeInTheDocument();
    expect(screen.queryByText('Đặt mặc định')).not.toBeInTheDocument();
  });

  it('renders checkbox in selection mode when not default', () => {
    render(
      <AddressCard
        {...defaultProps}
        isSelectionMode={true}
        isSelected={false}
        onToggleSelect={vi.fn()}
      />,
    );
    expect(screen.getByTestId('checkbox')).toBeInTheDocument();
  });

  it('does not render checkbox in selection mode when default', () => {
    render(
      <AddressCard
        {...defaultProps}
        isDefault={true}
        isSelectionMode={true}
        isSelected={false}
        onToggleSelect={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('checkbox')).not.toBeInTheDocument();
  });

  it('calls onToggleSelect when checkbox changed', () => {
    const onToggleSelect = vi.fn();
    render(
      <AddressCard
        {...defaultProps}
        isSelectionMode={true}
        isSelected={false}
        onToggleSelect={onToggleSelect}
      />,
    );
    fireEvent.click(screen.getByTestId('checkbox'));
    expect(onToggleSelect).toHaveBeenCalledWith('addr1');
  });

  it('uses custom label for "other" address type', () => {
    const otherAddress = { ...mockAddress, addressType: 'other' as const, label: 'Nhà bà ngoại' };
    render(<AddressCard {...defaultProps} address={otherAddress} />);
    expect(screen.getByText('Nhà bà ngoại')).toBeInTheDocument();
  });

  it('uses type label when addressType is not "other"', () => {
    render(<AddressCard {...defaultProps} />);
    expect(screen.getByText('Nhà')).toBeInTheDocument();
  });

  it('renders drag handle when not selection mode and not default', () => {
    const { container } = render(<AddressCard {...defaultProps} />);
    const dragHandle = container.querySelector('.opacity-0.transition-opacity');
    expect(dragHandle).toBeInTheDocument();
  });

  it('does not render drag handle in selection mode', () => {
    const { container } = render(<AddressCard {...defaultProps} isSelectionMode={true} />);
    const dragHandle = container.querySelector(
      '.opacity-0.transition-opacity.group-hover\\:opacity-100',
    );
    expect(dragHandle).not.toBeInTheDocument();
  });
});
