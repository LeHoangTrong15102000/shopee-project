import { describe, it, expect } from 'vitest';
import '@testing-library/react';
import { renderWithProviders } from 'src/utils/testUtils';
import OrderSummary from './OrderSummary';
import type { ExtendedPurchase } from 'src/types/purchases.type';

const mockItems: ExtendedPurchase[] = [
  {
    _id: 'purchase-1',
    buy_count: 2,
    price: 250000,
    price_before_discount: 350000,
    status: -1,
    user: 'user-1',
    product: {
      _id: 'prod-1',
      name: 'Áo thun nam cotton',
      price: 250000,
      price_before_discount: 350000,
      image: 'https://picsum.photos/200',
      images: [],
      quantity: 100,
      sold: 50,
      view: 200,
      rating: 4.5,
      category: { _id: 'cat-1', name: 'Thời trang' },
      description: 'Áo thun',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
      location: 'Hồ Chí Minh',
    },
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    checked: true,
    disabled: false,
    isChecked: true,
  } as ExtendedPurchase,
];

describe('OrderSummary', () => {
  it('displays order items and product names', () => {
    renderWithProviders(<OrderSummary items={mockItems} shippingMethod={null} />);

    const bodyText = document.body.textContent || '';
    expect(bodyText.includes('Áo thun nam cotton')).toBeTruthy();
  });

  it('displays price totals with currency symbol', () => {
    renderWithProviders(<OrderSummary items={mockItems} shippingMethod={null} />);

    const bodyText = document.body.textContent || '';
    expect(bodyText.includes('₫')).toBeTruthy();
  });

  it('displays order header with item count', () => {
    renderWithProviders(<OrderSummary items={mockItems} shippingMethod={null} />);

    const bodyText = document.body.textContent || '';
    expect(bodyText.includes('Đơn hàng')).toBeTruthy();
  });

  it('shows voucher discount when applied', () => {
    renderWithProviders(
      <OrderSummary
        items={mockItems}
        shippingMethod={null}
        voucherDiscount={50000}
        voucherCode="SAVE50K"
      />,
    );

    const bodyText = document.body.textContent || '';
    expect(
      bodyText.includes('Voucher') || bodyText.includes('voucher') || bodyText.includes('SAVE50K'),
    ).toBeTruthy();
  });
});
