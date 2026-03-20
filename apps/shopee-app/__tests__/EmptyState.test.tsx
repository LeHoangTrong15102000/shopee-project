import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import EmptyState from '../components/ui/EmptyState';
import { ShoppingBag } from 'lucide-react-native';

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    neutrals400: '#6e6e6e',
  }),
}));

describe('EmptyState', () => {
  it('renders icon and message', () => {
    const { getByText } = render(<EmptyState icon={ShoppingBag} message="No products found" />);
    expect(getByText('No products found')).toBeTruthy();
  });

  it('renders CTA button and calls onAction', () => {
    const onAction = jest.fn();
    const { getByText } = render(
      <EmptyState
        icon={ShoppingBag}
        message="No products"
        actionLabel="Browse all"
        onAction={onAction}
      />
    );
    fireEvent.press(getByText('Browse all'));
    expect(onAction).toHaveBeenCalled();
  });

  it('does not render CTA when actionLabel not provided', () => {
    const { queryByText } = render(<EmptyState icon={ShoppingBag} message="No products" />);
    expect(queryByText('Browse all')).toBeNull();
  });
});
