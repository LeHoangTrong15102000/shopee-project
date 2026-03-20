import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryBar from '../components/home/CategoryBar';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockCategories = [
  { _id: 'cat-1', name: 'Áo thun' },
  { _id: 'cat-2', name: 'Đồng hồ' },
];

describe('CategoryBar', () => {
  it('renders "All" chip and category chips', () => {
    const onSelect = jest.fn();
    const { getByText } = render(<CategoryBar categories={mockCategories} onSelect={onSelect} />);
    expect(getByText('CATEGORY_ALL')).toBeTruthy();
    expect(getByText('Áo thun')).toBeTruthy();
    expect(getByText('Đồng hồ')).toBeTruthy();
  });

  it('calls onSelect with category id when chip pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(<CategoryBar categories={mockCategories} onSelect={onSelect} />);
    fireEvent.press(getByText('Áo thun'));
    expect(onSelect).toHaveBeenCalledWith('cat-1');
  });

  it('calls onSelect with undefined when "All" pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <CategoryBar categories={mockCategories} selectedCategory="cat-1" onSelect={onSelect} />
    );
    fireEvent.press(getByText('CATEGORY_ALL'));
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });
});
