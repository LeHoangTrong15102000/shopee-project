import React from 'react';
import { render } from '@testing-library/react-native';
import SearchHeader from '../components/home/SearchHeader';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    primary: '#EE4D2D',
  }),
}));

describe('SearchHeader', () => {
  it('renders search placeholder text', () => {
    const { getByText } = render(<SearchHeader />);
    expect(getByText('SEARCH_PLACEHOLDER')).toBeTruthy();
  });

  it('renders without crashing', () => {
    const { toJSON } = render(<SearchHeader />);
    expect(toJSON()).toBeTruthy();
  });
});
