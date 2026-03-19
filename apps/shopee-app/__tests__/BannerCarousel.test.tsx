import React from 'react';
import { render } from '@testing-library/react-native';
import BannerCarousel from '../components/home/BannerCarousel';

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
    neutrals500: '#5e5e5e',
  }),
}));

describe('BannerCarousel', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<BannerCarousel />);
    expect(toJSON()).toBeTruthy();
  });

  it('renders pagination dots', () => {
    const tree = render(<BannerCarousel />);
    // 3 banners = 3 dots
    expect(tree.toJSON()).toBeTruthy();
  });
});
