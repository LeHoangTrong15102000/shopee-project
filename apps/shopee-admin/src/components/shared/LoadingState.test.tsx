import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders spinner by default', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders skeleton variant', () => {
    render(<LoadingState variant="skeleton" rows={3} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
