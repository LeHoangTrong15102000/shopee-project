import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WishlistButton from '../components/product-detail/WishlistButton';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    foreground: '#fff',
  }),
}));

describe('WishlistButton', () => {
  const onToggle = jest.fn();

  beforeEach(() => {
    onToggle.mockClear();
    jest.spyOn(Date, 'now').mockRestore();
  });

  it('calls onToggle when pressed', () => {
    const { getByRole } = render(<WishlistButton inWishlist={false} onToggle={onToggle} />);
    fireEvent.press(getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('debounces rapid taps (300ms)', () => {
    let now = 1000;
    jest.spyOn(Date, 'now').mockImplementation(() => now);

    const { getByRole } = render(<WishlistButton inWishlist={false} onToggle={onToggle} />);
    const btn = getByRole('button');

    fireEvent.press(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);

    now += 100; // 100ms later — should be debounced
    fireEvent.press(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);

    now += 300; // 400ms total — should go through
    fireEvent.press(btn);
    expect(onToggle).toHaveBeenCalledTimes(2);
  });

  it('does not call onToggle when loading', () => {
    const { getByRole } = render(<WishlistButton inWishlist={false} onToggle={onToggle} loading />);
    fireEvent.press(getByRole('button'));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('sets selected accessibility state when in wishlist', () => {
    const { getByRole } = render(<WishlistButton inWishlist={true} onToggle={onToggle} />);
    expect(getByRole('button').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
  });

  it('sets not-selected accessibility state when not in wishlist', () => {
    const { getByRole } = render(<WishlistButton inWishlist={false} onToggle={onToggle} />);
    expect(getByRole('button').props.accessibilityState).toEqual(
      expect.objectContaining({ selected: false })
    );
  });
});
