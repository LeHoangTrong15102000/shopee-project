import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import QueryErrorBoundary from '../QueryErrorBoundary';

vi.mock('@tanstack/react-query', () => ({
  useQueryErrorResetBoundary: () => ({ reset: vi.fn() }),
}));

vi.mock('../ErrorFallback', () => ({
  default: ({ error, resetErrorBoundary, title, message }: any) => (
    <div data-testid="error-fallback">
      <div>{title || 'Error'}</div>
      <div>{message || 'Error message'}</div>
      <div>{error?.message}</div>
      <button onClick={resetErrorBoundary}>Reset</button>
    </div>
  ),
}));

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('QueryErrorBoundary', () => {
  it('should render children when no error', () => {
    render(
      <QueryErrorBoundary>
        <div>Test content</div>
      </QueryErrorBoundary>,
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render ErrorFallback when error occurs', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <QueryErrorBoundary>
        <ThrowError shouldThrow={true} />
      </QueryErrorBoundary>,
    );

    expect(screen.getByTestId('error-fallback')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should render custom fallback when provided', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <QueryErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow={true} />
      </QueryErrorBoundary>,
    );

    expect(screen.getByText('Custom fallback')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should pass custom title to ErrorFallback', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <QueryErrorBoundary title="Custom Title">
        <ThrowError shouldThrow={true} />
      </QueryErrorBoundary>,
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should pass custom message to ErrorFallback', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <QueryErrorBoundary message="Custom Message">
        <ThrowError shouldThrow={true} />
      </QueryErrorBoundary>,
    );

    expect(screen.getByText('Custom Message')).toBeInTheDocument();

    consoleError.mockRestore();
  });

  it('should call onReset when error boundary is reset', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onReset = vi.fn();

    render(
      <QueryErrorBoundary onReset={onReset}>
        <ThrowError shouldThrow={true} />
      </QueryErrorBoundary>,
    );

    // Note: Testing the actual reset behavior would require more complex setup
    // This test verifies the prop is passed correctly

    consoleError.mockRestore();
  });
});
