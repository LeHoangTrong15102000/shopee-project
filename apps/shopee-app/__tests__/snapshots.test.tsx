import React from 'react';
import { render } from '@testing-library/react-native';
import InlineError from '../components/ui/InlineError';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { ShoppingBag } from 'lucide-react-native';

jest.mock('@/hooks/useColors', () => ({
  useColors: () => ({
    error: '#e4626f',
    neutrals400: '#6e6e6e',
    neutrals700: '#414240',
  }),
}));

describe('Snapshot tests', () => {
  it('InlineError matches snapshot', () => {
    const tree = render(<InlineError message="Error occurred" onRetry={() => {}} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('EmptyState matches snapshot', () => {
    const tree = render(
      <EmptyState
        icon={ShoppingBag}
        message="Nothing here"
        actionLabel="Go back"
        onAction={() => {}}
      />
    );
    expect(tree.toJSON()).toMatchSnapshot();
  });

  it('SkeletonLoader matches snapshot', () => {
    const tree = render(<SkeletonLoader width={100} height={100} borderRadius={8} />);
    expect(tree.toJSON()).toMatchSnapshot();
  });
});
