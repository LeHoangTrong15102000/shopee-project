import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CardTypeIcon, CheckmarkIcon, InfoIcon } from '../CardTypeIcons';

describe('CardTypeIcon', () => {
  it('renders visa icon', () => {
    const { container } = render(<CardTypeIcon type="visa" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders mastercard icon', () => {
    const { container } = render(<CardTypeIcon type="mastercard" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders amex icon', () => {
    const { container } = render(<CardTypeIcon type="amex" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders jcb icon', () => {
    const { container } = render(<CardTypeIcon type="jcb" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders unknown card icon', () => {
    const { container } = render(<CardTypeIcon type="unknown" />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('CheckmarkIcon', () => {
  it('renders svg', () => {
    const { container } = render(<CheckmarkIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});

describe('InfoIcon', () => {
  it('renders svg', () => {
    const { container } = render(<InfoIcon />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
