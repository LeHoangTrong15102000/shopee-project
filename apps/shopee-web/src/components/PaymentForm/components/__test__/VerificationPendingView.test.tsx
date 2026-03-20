import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerificationPendingView from '../VerificationPendingView';

describe('VerificationPendingView', () => {
  it('renders verification title', () => {
    render(<VerificationPendingView />);
    expect(screen.getByText('Đang xác minh thanh toán')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<VerificationPendingView />);
    expect(screen.getByText(/Chúng tôi đang kiểm tra giao dịch/)).toBeInTheDocument();
  });

  it('renders processing indicator', () => {
    render(<VerificationPendingView />);
    expect(screen.getByText('Đang xử lý...')).toBeInTheDocument();
  });
});
