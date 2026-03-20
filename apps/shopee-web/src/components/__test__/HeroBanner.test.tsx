import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import React from 'react';
import HeroBanner from '../HeroBanner/HeroBanner';
import FormField from '../FormField/FormField';
import InputV2 from '../InputV2/InputV2';
import KeyboardShortcutsModal from '../KeyboardShortcutsModal/KeyboardShortcutsModal';
import OrderTrackingTimeline from '../OrderTrackingTimeline/OrderTrackingTimeline';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'vi', changeLanguage: vi.fn() },
  }),
  Trans: ({ children }: any) => children,
}));

vi.mock('src/hooks/useReducedMotion', () => ({
  useReducedMotion: () => false,
}));

vi.mock('react-hook-form', () => ({
  useController: () => ({
    field: {
      value: '',
      onChange: vi.fn(),
      onBlur: vi.fn(),
      name: 'test',
      ref: vi.fn(),
    },
    fieldState: {
      error: undefined,
    },
  }),
}));

describe('HeroBanner', () => {
  it('renders hero banner', () => {
    const { container } = render(
      <MemoryRouter>
        <HeroBanner />
      </MemoryRouter>,
    );
    expect(container.querySelector('[class]')).not.toBeNull();
  });
});

describe('FormField', () => {
  it('renders form field with label', () => {
    render(
      <FormField label="Test Label">
        <input type="text" />
      </FormField>,
    );
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('renders with error message', () => {
    render(
      <FormField label="Test Label" error="Error message">
        <input type="text" />
      </FormField>,
    );
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders with required indicator', () => {
    render(
      <FormField label="Test Label" required={true}>
        <input type="text" />
      </FormField>,
    );
    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });
});

describe('InputV2', () => {
  it('renders input field', () => {
    const { container } = render(<InputV2 name="test" control={{} as any} />);
    expect(container.querySelector('input')).not.toBeNull();
  });

  it('renders with custom class', () => {
    const { container } = render(
      <InputV2 name="test" control={{} as any} classNameInput="custom-class" />,
    );
    expect(container.querySelector('input')).not.toBeNull();
  });
});

describe('KeyboardShortcutsModal', () => {
  const mockShortcuts = [
    { key: 'k', ctrlKey: true, description: 'Search', category: 'Navigation' },
  ];

  it('renders closed modal', () => {
    const { container } = render(
      <KeyboardShortcutsModal isOpen={false} onClose={vi.fn()} shortcuts={mockShortcuts} />,
    );
    expect(container.firstChild).toBeFalsy();
  });

  it('renders open modal with shortcut info', () => {
    render(<KeyboardShortcutsModal isOpen={true} onClose={vi.fn()} shortcuts={mockShortcuts} />);
    expect(screen.getByText('Search')).toBeInTheDocument();
  });
});

describe('OrderTrackingTimeline', () => {
  const mockTracking = {
    _id: '1',
    order_id: '1',
    carrier: 'ghn',
    tracking_number: 'TN123',
    status: 'pending' as const,
    estimated_delivery: '2024-12-31',
    timeline: [{ status: 'pending', description: 'Order placed', timestamp: '2024-01-01' }],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  it('renders tracking timeline', () => {
    render(<OrderTrackingTimeline tracking={mockTracking} />);
    expect(screen.getByText('Order placed')).toBeInTheDocument();
  });

  it('renders with multiple timeline events', () => {
    const trackingWithEvents = {
      ...mockTracking,
      status: 'confirmed' as const,
      timeline: [
        { status: 'pending', description: 'Order placed', timestamp: '2024-01-01' },
        { status: 'confirmed', description: 'Order confirmed', timestamp: '2024-01-02' },
      ],
    };
    render(<OrderTrackingTimeline tracking={trackingWithEvents} />);
    expect(screen.getByText('Order placed')).toBeInTheDocument();
    expect(screen.getByText('Order confirmed')).toBeInTheDocument();
  });
});
