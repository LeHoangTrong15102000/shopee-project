import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import {
  CartIcon,
  SearchIcon,
  FilterIcon,
  CategoryIcon,
  ArrowIcon,
  TruckIcon,
  RocketIcon,
  LightningIcon,
  CodIcon,
  BankIcon,
  WalletIcon,
  CreditCardIcon,
  EyeIcon,
  FireIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  ShieldIcon,
  DeliveryTruckIcon,
  ShieldCheckIcon,
  ShippingIcon,
  PaymentIcon,
  SHIPPING_ICONS,
  PAYMENT_ICONS,
} from '../Icons';

describe('Icons', () => {
  describe('Basic Icons', () => {
    it('renders CartIcon with default props', () => {
      const { container } = render(<CartIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('class')).toBe('h-5 w-5');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(svg?.getAttribute('fill')).toBe('currentColor');
    });

    it('renders CartIcon with custom className', () => {
      const { container } = render(<CartIcon className="custom-class" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toBe('custom-class');
    });

    it('renders SearchIcon with SVG element', () => {
      const { container } = render(<SearchIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.querySelector('path')).toBeTruthy();
    });

    it('renders FilterIcon with custom props', () => {
      const { container } = render(<FilterIcon className="filter-custom" viewBox="0 0 20 20" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toBe('filter-custom');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 20 20');
    });

    it('renders CategoryIcon with SVG element', () => {
      const { container } = render(<CategoryIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('viewBox')).toBe('0 0 12 10');
    });

    it('renders ArrowIcon with SVG element', () => {
      const { container } = render(<ArrowIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.querySelector('polygon')).toBeTruthy();
    });
  });

  describe('Shipping Icons', () => {
    it('renders TruckIcon with default props', () => {
      const { container } = render(<TruckIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('class')).toBe('h-5 w-5');
      expect(svg?.getAttribute('fill')).toBe('none');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders TruckIcon with custom className', () => {
      const { container } = render(<TruckIcon className="truck-custom" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toBe('truck-custom');
    });

    it('renders RocketIcon with SVG element', () => {
      const { container } = render(<RocketIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.querySelector('path')).toBeTruthy();
    });

    it('renders LightningIcon with SVG element', () => {
      const { container } = render(<LightningIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.querySelector('path')).toBeTruthy();
    });
  });

  describe('Payment Icons', () => {
    it('renders CodIcon with default props', () => {
      const { container } = render(<CodIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('class')).toBe('h-5 w-5');
      expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('renders BankIcon with custom className', () => {
      const { container } = render(<BankIcon className="bank-custom" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toBe('bank-custom');
    });

    it('renders WalletIcon with SVG element', () => {
      const { container } = render(<WalletIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.querySelector('path')).toBeTruthy();
    });

    it('renders CreditCardIcon with SVG element', () => {
      const { container } = render(<CreditCardIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.querySelector('path')).toBeTruthy();
    });
  });

  describe('Product Detail Icons', () => {
    it('renders EyeIcon with default props', () => {
      const { container } = render(<EyeIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('class')).toBe('h-4 w-4');
    });

    it('renders FireIcon with SVG element', () => {
      const { container } = render(<FireIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
    });

    it('renders ArrowDownIcon with SVG element', () => {
      const { container } = render(<ArrowDownIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('class')).toBe('h-3 w-3');
    });

    it('renders ArrowUpIcon with SVG element', () => {
      const { container } = render(<ArrowUpIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('class')).toBe('h-3 w-3');
    });

    it('renders ChevronRightIcon with SVG element', () => {
      const { container } = render(<ChevronRightIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('class')).toBe('h-3.5 w-3.5');
    });

    it('renders ShieldIcon with SVG element', () => {
      const { container } = render(<ShieldIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('fill')).toBe('currentColor');
    });

    it('renders DeliveryTruckIcon with SVG element', () => {
      const { container } = render(<DeliveryTruckIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.getAttribute('fill')).toBe('none');
    });

    it('renders ShieldCheckIcon with SVG element', () => {
      const { container } = render(<ShieldCheckIcon />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
      expect(svg?.querySelector('path')).toBeTruthy();
    });
  });

  describe('ShippingIcon lookup component', () => {
    it('renders TruckIcon for "truck" type', () => {
      const { container } = render(<ShippingIcon type="truck" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders RocketIcon for "rocket" type', () => {
      const { container } = render(<ShippingIcon type="rocket" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders LightningIcon for "lightning" type', () => {
      const { container } = render(<ShippingIcon type="lightning" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders LightningIcon for "express" alias', () => {
      const { container } = render(<ShippingIcon type="express" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders RocketIcon for "fast" alias', () => {
      const { container } = render(<ShippingIcon type="fast" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders TruckIcon as fallback for unknown type', () => {
      const { container } = render(<ShippingIcon type="unknown" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('passes className to ShippingIcon', () => {
      const { container } = render(<ShippingIcon type="truck" className="custom-shipping" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toBe('custom-shipping');
    });
  });

  describe('PaymentIcon lookup component', () => {
    it('renders CodIcon for "cod" type', () => {
      const { container } = render(<PaymentIcon type="cod" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders BankIcon for "bank_transfer" type', () => {
      const { container } = render(<PaymentIcon type="bank_transfer" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders WalletIcon for "e_wallet" type', () => {
      const { container } = render(<PaymentIcon type="e_wallet" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders CreditCardIcon for "credit_card" type', () => {
      const { container } = render(<PaymentIcon type="credit_card" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('renders CodIcon as fallback for unknown type', () => {
      const { container } = render(<PaymentIcon type="unknown" />);
      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();
    });

    it('passes className to PaymentIcon', () => {
      const { container } = render(<PaymentIcon type="cod" className="custom-payment" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toBe('custom-payment');
    });
  });

  describe('Icon lookup exports', () => {
    it('exports SHIPPING_ICONS with correct keys', () => {
      expect(SHIPPING_ICONS).toBeDefined();
      expect(SHIPPING_ICONS.truck).toBe(TruckIcon);
      expect(SHIPPING_ICONS.rocket).toBe(RocketIcon);
      expect(SHIPPING_ICONS.lightning).toBe(LightningIcon);
      expect(SHIPPING_ICONS.express).toBe(LightningIcon);
      expect(SHIPPING_ICONS.fast).toBe(RocketIcon);
    });

    it('exports PAYMENT_ICONS with correct keys', () => {
      expect(PAYMENT_ICONS).toBeDefined();
      expect(PAYMENT_ICONS.cod).toBe(CodIcon);
      expect(PAYMENT_ICONS.bank_transfer).toBe(BankIcon);
      expect(PAYMENT_ICONS.e_wallet).toBe(WalletIcon);
      expect(PAYMENT_ICONS.credit_card).toBe(CreditCardIcon);
    });

    it('SHIPPING_ICONS contains all expected keys', () => {
      const keys = Object.keys(SHIPPING_ICONS);
      expect(keys).toContain('truck');
      expect(keys).toContain('rocket');
      expect(keys).toContain('lightning');
      expect(keys).toContain('express');
      expect(keys).toContain('fast');
      expect(keys.length).toBe(5);
    });

    it('PAYMENT_ICONS contains all expected keys', () => {
      const keys = Object.keys(PAYMENT_ICONS);
      expect(keys).toContain('cod');
      expect(keys).toContain('bank_transfer');
      expect(keys).toContain('e_wallet');
      expect(keys).toContain('credit_card');
      expect(keys.length).toBe(4);
    });
  });

  describe('Icon props variations', () => {
    it('renders icon with custom fill prop', () => {
      const { container } = render(<CartIcon fill="#ff0000" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('fill')).toBe('#ff0000');
    });

    it('renders icon with custom viewBox prop', () => {
      const { container } = render(<SearchIcon viewBox="0 0 32 32" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 32 32');
    });

    it('renders icon with all custom props', () => {
      const { container } = render(
        <FilterIcon className="custom" viewBox="0 0 16 16" fill="none" />,
      );
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('class')).toBe('custom');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 16 16');
      expect(svg?.getAttribute('fill')).toBe('none');
    });
  });
});
