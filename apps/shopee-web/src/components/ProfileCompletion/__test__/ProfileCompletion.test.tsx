import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import BenefitsPanel from '../components/BenefitsPanel';
import CircularProgressRing from '../components/CircularProgressRing';
import ProfileCompletionTip from '../components/ProfileCompletionTip';
import CongratulatoryPanel from '../components/CongratulatoryPanel';

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get:
        (_target, prop) =>
        ({ children, ...props }: any) => {
          const Tag = typeof prop === 'string' ? prop : 'div';
          return <Tag {...props}>{children}</Tag>;
        },
    },
  ),
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'vi' } }),
}));

describe('ProfileCompletion Components', () => {
  describe('CongratulatoryPanel', () => {
    it('renders congratulatory panel with reduced motion', () => {
      const { container } = render(<CongratulatoryPanel reducedMotion={true} />);
      expect(screen.getByText('profileCompletion.congrats.title')).toBeInTheDocument();
    });

    it('renders congratulatory panel without reduced motion', () => {
      const { container } = render(<CongratulatoryPanel reducedMotion={false} />);
      expect(screen.getByText('profileCompletion.congrats.title')).toBeInTheDocument();
    });

    it('displays congratulatory title and message', () => {
      render(<CongratulatoryPanel reducedMotion={true} />);
      expect(screen.getByText('profileCompletion.congrats.title')).toBeInTheDocument();
      expect(screen.getByText('profileCompletion.congrats.message')).toBeInTheDocument();
    });

    it('displays verified badge', () => {
      render(<CongratulatoryPanel reducedMotion={true} />);
      expect(screen.getByText('profileCompletion.congrats.verified')).toBeInTheDocument();
    });

    it('renders star icon', () => {
      const { container } = render(<CongratulatoryPanel reducedMotion={true} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('ProfileCompletionTip', () => {
    it('renders tip panel with reduced motion', () => {
      render(
        <BrowserRouter>
          <ProfileCompletionTip reducedMotion={true} />
        </BrowserRouter>,
      );
      expect(screen.getByText('profileCompletion.tip.title')).toBeInTheDocument();
    });

    it('renders tip panel without reduced motion', () => {
      render(
        <BrowserRouter>
          <ProfileCompletionTip reducedMotion={false} />
        </BrowserRouter>,
      );
      expect(screen.getByText('profileCompletion.tip.title')).toBeInTheDocument();
    });

    it('displays tip message', () => {
      render(
        <BrowserRouter>
          <ProfileCompletionTip reducedMotion={true} />
        </BrowserRouter>,
      );
      expect(screen.getByText('profileCompletion.tip.message')).toBeInTheDocument();
    });

    it('renders button with correct text', () => {
      render(
        <BrowserRouter>
          <ProfileCompletionTip reducedMotion={true} />
        </BrowserRouter>,
      );
      expect(screen.getByText('profileCompletion.tip.button')).toBeInTheDocument();
    });

    it('has correct link to profile page', () => {
      render(
        <BrowserRouter>
          <ProfileCompletionTip reducedMotion={true} />
        </BrowserRouter>,
      );
      const link = screen.getByText('profileCompletion.tip.button').closest('a');
      expect(link).toHaveAttribute('href', '/user/profile');
    });

    it('has role alert for accessibility', () => {
      const { container } = render(
        <BrowserRouter>
          <ProfileCompletionTip reducedMotion={true} />
        </BrowserRouter>,
      );
      const alertElement = container.querySelector('[role="alert"]');
      expect(alertElement).toBeInTheDocument();
    });
  });

  describe('CircularProgressRing', () => {
    const defaultProps = {
      percentage: 60,
      circumference: 251.2,
      strokeDashoffset: 100.48,
      statusColor: { from: '#3b82f6', to: '#8b5cf6' },
      reducedMotion: false,
      radius: 40,
    };

    it('renders progress ring with correct percentage', () => {
      render(<CircularProgressRing {...defaultProps} />);
      expect(screen.getByText('60%')).toBeInTheDocument();
    });

    it('renders completion text', () => {
      render(<CircularProgressRing {...defaultProps} />);
      expect(screen.getByText('hoàn thành')).toBeInTheDocument();
    });

    it('has correct aria attributes', () => {
      const { container } = render(<CircularProgressRing {...defaultProps} />);
      const progressbar = container.querySelector('[role="progressbar"]');
      expect(progressbar).toHaveAttribute('aria-valuenow', '60');
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });

    it('renders SVG circles', () => {
      const { container } = render(<CircularProgressRing {...defaultProps} />);
      const circles = container.querySelectorAll('circle');
      expect(circles.length).toBeGreaterThanOrEqual(2);
    });

    it('does not render sparkles when percentage is not 100', () => {
      const { container } = render(<CircularProgressRing {...defaultProps} />);
      const sparkles = container.querySelectorAll('.bg-linear-to-r.from-yellow-300');
      expect(sparkles.length).toBe(0);
    });

    it('renders sparkles when percentage is 100 and motion is enabled', () => {
      const { container } = render(
        <CircularProgressRing {...defaultProps} percentage={100} reducedMotion={false} />,
      );
      const sparkles = container.querySelectorAll('.bg-linear-to-r.from-yellow-300');
      expect(sparkles.length).toBeGreaterThan(0);
    });

    it('does not render sparkles when reduced motion is enabled', () => {
      const { container } = render(
        <CircularProgressRing {...defaultProps} percentage={100} reducedMotion={true} />,
      );
      const sparkles = container.querySelectorAll('.bg-linear-to-r.from-yellow-300');
      expect(sparkles.length).toBe(0);
    });

    it('renders with different percentage values', () => {
      const { rerender } = render(<CircularProgressRing {...defaultProps} percentage={25} />);
      expect(screen.getByText('25%')).toBeInTheDocument();

      rerender(<CircularProgressRing {...defaultProps} percentage={75} />);
      expect(screen.getByText('75%')).toBeInTheDocument();

      rerender(<CircularProgressRing {...defaultProps} percentage={100} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('BenefitsPanel', () => {
    it('renders benefits panel with reduced motion', () => {
      render(<BenefitsPanel reducedMotion={true} />);
      expect(screen.getByText('profileCompletion.benefits.title')).toBeInTheDocument();
    });

    it('renders benefits panel without reduced motion', () => {
      render(<BenefitsPanel reducedMotion={false} />);
      expect(screen.getByText('profileCompletion.benefits.title')).toBeInTheDocument();
    });

    it('renders all three benefit items', () => {
      render(<BenefitsPanel reducedMotion={true} />);
      expect(screen.getByText('profileCompletion.benefits.security.title')).toBeInTheDocument();
      expect(screen.getByText('profileCompletion.benefits.rewards.title')).toBeInTheDocument();
      expect(screen.getByText('profileCompletion.benefits.shipping.title')).toBeInTheDocument();
    });

    it('renders benefit descriptions', () => {
      render(<BenefitsPanel reducedMotion={true} />);
      expect(screen.getByText('profileCompletion.benefits.security.desc')).toBeInTheDocument();
      expect(screen.getByText('profileCompletion.benefits.rewards.desc')).toBeInTheDocument();
      expect(screen.getByText('profileCompletion.benefits.shipping.desc')).toBeInTheDocument();
    });

    it('renders icons for each benefit', () => {
      const { container } = render(<BenefitsPanel reducedMotion={true} />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThanOrEqual(3);
    });

    it('has correct structure with icon and text', () => {
      const { container } = render(<BenefitsPanel reducedMotion={true} />);
      const benefitItems = container.querySelectorAll('.flex.items-start.gap-2\\.5');
      expect(benefitItems.length).toBe(3);
    });
  });
});
