// Centralized Icons để tối ưu hóa bundle size
// React 19 tự động tối ưu hóa nên không cần memo()

interface IconProps {
  className?: string
  viewBox?: string
  fill?: string
}

export const CartIcon = ({ className = 'h-5 w-5', viewBox = '0 0 24 24', fill = 'currentColor' }: IconProps) => (
  <svg className={className} viewBox={viewBox} fill={fill}>
    <path d='M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z' />
  </svg>
)

export const SearchIcon = ({ className = 'h-5 w-5', viewBox = '0 0 24 24', fill = 'currentColor' }: IconProps) => (
  <svg className={className} viewBox={viewBox} fill={fill}>
    <path d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' />
  </svg>
)

export const FilterIcon = ({ className = 'h-4 w-3', viewBox = '0 0 15 15', fill = 'currentColor' }: IconProps) => (
  <svg className={className} viewBox={viewBox} fill={fill}>
    <g>
      <polyline
        fill='none'
        points='5.5 13.2 5.5 5.8 1.5 1.2 13.5 1.2 9.5 5.8 9.5 10.2'
        stroke='currentColor'
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeMiterlimit={10}
      />
    </g>
  </svg>
)

export const CategoryIcon = ({ className = 'h-4 w-3', viewBox = '0 0 12 10', fill = 'currentColor' }: IconProps) => (
  <svg className={className} viewBox={viewBox} fill={fill}>
    <g fillRule='evenodd' stroke='none' strokeWidth={1}>
      <g transform='translate(-373 -208)'>
        <g transform='translate(155 191)'>
          <g transform='translate(218 17)'>
            <path d='m0 2h2v-2h-2zm4 0h7.1519633v-2h-7.1519633z' />
            <path d='m0 6h2v-2h-2zm4 0h7.1519633v-2h-7.1519633z' />
            <path d='m0 10h2v-2h-2zm4 0h7.1519633v-2h-7.1519633z' />
          </g>
        </g>
      </g>
    </g>
  </svg>
)

export const ArrowIcon = ({ className = 'h-2 w-2', viewBox = '0 0 4 7', fill = 'currentColor' }: IconProps) => (
  <svg className={className} viewBox={viewBox} fill={fill}>
    <polygon points='4 3.5 0 0 0 7' />
  </svg>
)

// ============================================
// Checkout Icons - Shipping & Payment
// ============================================

interface CheckoutIconProps {
  className?: string
}

// Shipping Icons
export const TruckIcon = ({ className = 'h-5 w-5' }: CheckoutIconProps) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path
      d='M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

export const RocketIcon = ({ className = 'h-5 w-5' }: CheckoutIconProps) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path
      d='M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

export const LightningIcon = ({ className = 'h-5 w-5' }: CheckoutIconProps) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path
      d='M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

// Payment Icons
export const CodIcon = ({ className = 'h-5 w-5' }: CheckoutIconProps) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path
      d='M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

export const BankIcon = ({ className = 'h-5 w-5' }: CheckoutIconProps) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path
      d='M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

export const WalletIcon = ({ className = 'h-5 w-5' }: CheckoutIconProps) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path
      d='M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

export const CreditCardIcon = ({ className = 'h-5 w-5' }: CheckoutIconProps) => (
  <svg className={className} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
    <path
      d='M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z'
      stroke='currentColor'
      strokeWidth={2}
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
)

// Icon lookup helpers
export const SHIPPING_ICONS: Record<string, React.FC<CheckoutIconProps>> = {
  truck: TruckIcon,
  rocket: RocketIcon,
  lightning: LightningIcon,
  express: LightningIcon, // alias
  fast: RocketIcon // alias
}

export const PAYMENT_ICONS: Record<string, React.FC<CheckoutIconProps>> = {
  cod: CodIcon,
  bank_transfer: BankIcon,
  e_wallet: WalletIcon,
  credit_card: CreditCardIcon
}

// Convenience components with type lookup
export const ShippingIcon = ({ type, className }: { type: string; className?: string }) => {
  const Icon = SHIPPING_ICONS[type] || TruckIcon
  return <Icon className={className} />
}

export const PaymentIcon = ({ type, className }: { type: string; className?: string }) => {
  const Icon = PAYMENT_ICONS[type] || CodIcon
  return <Icon className={className} />
}
