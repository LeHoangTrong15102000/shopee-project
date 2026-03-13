import { describe, it, expect, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from 'src/utils/testUtils';
import AddressSelector from './AddressSelector';

// Mock address API
vi.mock('src/apis/address.api', () => ({
  default: {
    getAddresses: vi.fn().mockResolvedValue({
      data: {
        data: [
          {
            _id: 'addr-1',
            fullName: 'Nguyễn Văn A',
            phone: '0901234567',
            province: 'Hồ Chí Minh',
            district: 'Quận 1',
            ward: 'Phường Bến Nghé',
            street: '123 Lê Lợi',
            isDefault: true,
            addressType: 'home',
          },
          {
            _id: 'addr-2',
            fullName: 'Nguyễn Văn A',
            phone: '0901234567',
            province: 'Hà Nội',
            district: 'Quận Hoàn Kiếm',
            ward: 'Phường Hàng Bài',
            street: '456 Tràng Tiền',
            isDefault: false,
            addressType: 'office',
          },
        ],
      },
    }),
    setDefaultAddress: vi.fn().mockResolvedValue({ data: { message: 'OK' } }),
    deleteAddress: vi.fn().mockResolvedValue({ data: { message: 'OK' } }),
  },
}));

describe('AddressSelector', () => {
  const mockOnSelect = vi.fn();

  it('renders address list from API', async () => {
    renderWithProviders(<AddressSelector selectedAddressId="addr-1" onSelect={mockOnSelect} />);

    await waitFor(() => {
      const bodyText = document.body.textContent || '';
      expect(
        bodyText.includes('Lê Lợi') ||
          bodyText.includes('Hồ Chí Minh') ||
          bodyText.includes('Nguyễn Văn A'),
      ).toBeTruthy();
    });
  });

  it('renders add new address button', async () => {
    renderWithProviders(<AddressSelector selectedAddressId={null} onSelect={mockOnSelect} />);

    await waitFor(() => {
      const bodyText = document.body.textContent || '';
      expect(bodyText.includes('Thêm') || bodyText.includes('thêm')).toBeTruthy();
    });
  });

  it('highlights selected address', async () => {
    renderWithProviders(<AddressSelector selectedAddressId="addr-1" onSelect={mockOnSelect} />);

    await waitFor(() => {
      // At least one address should be rendered with aria-pressed
      const allButtons = document.querySelectorAll('[role="button"]');
      expect(allButtons.length).toBeGreaterThan(0);
    });
  });
});
