import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  SecurityBadge,
  PaymentIcons,
  TrustIndicators,
} from '../../Checkout/components/TrustIndicators';

describe('TrustIndicators', () => {
  describe('SecurityBadge', () => {
    it('renders security text', () => {
      const { container } = render(<SecurityBadge />);
      expect(container.textContent).toContain('Thanh toán an toàn');
    });
  });

  describe('PaymentIcons', () => {
    it('renders all payment methods', () => {
      render(<PaymentIcons />);
      expect(screen.getByText('VISA')).toBeInTheDocument();
      expect(screen.getByText('Master')).toBeInTheDocument();
      expect(screen.getByText('JCB')).toBeInTheDocument();
      expect(screen.getByText('MoMo')).toBeInTheDocument();
      expect(screen.getByText('ZaloPay')).toBeInTheDocument();
      expect(screen.getByText('VNPay')).toBeInTheDocument();
    });
  });

  describe('TrustIndicators component', () => {
    it('renders all trust badges', () => {
      const { container } = render(<TrustIndicators />);
      expect(container.textContent).toContain('Chính hãng');
      expect(container.textContent).toContain('Đổi trả 7 ngày');
      expect(container.textContent).toContain('Giao nhanh');
    });

    it('renders 3 trust indicator sections', () => {
      const { container } = render(<TrustIndicators />);
      const sections = container.querySelectorAll('.flex.flex-col.items-center');
      expect(sections.length).toBe(3);
    });
  });
});
