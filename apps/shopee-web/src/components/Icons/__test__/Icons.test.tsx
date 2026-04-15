import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
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
} from '../index'

describe('Icons', () => {
  const iconComponents = [
    { name: 'CartIcon', Component: CartIcon },
    { name: 'SearchIcon', Component: SearchIcon },
    { name: 'FilterIcon', Component: FilterIcon },
    { name: 'CategoryIcon', Component: CategoryIcon },
    { name: 'ArrowIcon', Component: ArrowIcon },
    { name: 'TruckIcon', Component: TruckIcon },
    { name: 'RocketIcon', Component: RocketIcon },
    { name: 'LightningIcon', Component: LightningIcon },
    { name: 'CodIcon', Component: CodIcon },
    { name: 'BankIcon', Component: BankIcon },
    { name: 'WalletIcon', Component: WalletIcon },
    { name: 'CreditCardIcon', Component: CreditCardIcon },
    { name: 'EyeIcon', Component: EyeIcon },
    { name: 'FireIcon', Component: FireIcon },
    { name: 'ArrowDownIcon', Component: ArrowDownIcon },
    { name: 'ArrowUpIcon', Component: ArrowUpIcon },
    { name: 'ChevronRightIcon', Component: ChevronRightIcon },
    { name: 'ShieldIcon', Component: ShieldIcon },
    { name: 'DeliveryTruckIcon', Component: DeliveryTruckIcon },
    { name: 'ShieldCheckIcon', Component: ShieldCheckIcon },
  ]

  iconComponents.forEach(({ name, Component }) => {
    it(`renders ${name} as svg`, () => {
      const { container } = render(<Component />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it(`${name} accepts custom className`, () => {
      const { container } = render(<Component className="custom-size" />)
      expect(container.querySelector('svg')).toHaveClass('custom-size')
    })
  })

  describe('ShippingIcon lookup', () => {
    it('renders TruckIcon for "truck" type', () => {
      const { container } = render(<ShippingIcon type="truck" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders RocketIcon for "fast" type', () => {
      const { container } = render(<ShippingIcon type="fast" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders LightningIcon for "express" type', () => {
      const { container } = render(<ShippingIcon type="express" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('falls back to TruckIcon for unknown type', () => {
      const { container } = render(<ShippingIcon type="unknown" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('passes className to icon', () => {
      const { container } = render(<ShippingIcon type="truck" className="w-8 h-8" />)
      expect(container.querySelector('svg')).toHaveClass('w-8 h-8')
    })
  })

  describe('PaymentIcon lookup', () => {
    it('renders CodIcon for "cod" type', () => {
      const { container } = render(<PaymentIcon type="cod" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders BankIcon for "bank_transfer" type', () => {
      const { container } = render(<PaymentIcon type="bank_transfer" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders WalletIcon for "e_wallet" type', () => {
      const { container } = render(<PaymentIcon type="e_wallet" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('renders CreditCardIcon for "credit_card" type', () => {
      const { container } = render(<PaymentIcon type="credit_card" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })

    it('falls back to CodIcon for unknown type', () => {
      const { container } = render(<PaymentIcon type="unknown" />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('icon lookup maps', () => {
    it('SHIPPING_ICONS has expected keys', () => {
      expect(Object.keys(SHIPPING_ICONS)).toEqual([
        'truck',
        'rocket',
        'lightning',
        'express',
        'fast',
      ])
    })

    it('PAYMENT_ICONS has expected keys', () => {
      expect(Object.keys(PAYMENT_ICONS)).toEqual([
        'cod',
        'bank_transfer',
        'e_wallet',
        'credit_card',
      ])
    })
  })
})
