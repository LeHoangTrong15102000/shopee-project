import { memo } from 'react'

export type CardType = 'visa' | 'mastercard' | 'jcb' | 'amex' | 'unknown'

const VisaSvgIcon = memo(function VisaSvgIcon() {
  return (
    <svg viewBox='0 0 48 32' className='h-6 w-9'>
      <rect width='48' height='32' rx='4' fill='#1A1F71' />
      <path
        d='M19.5 21h-2.7l1.7-10.5h2.7L19.5 21zm-4.8 0h-2.8l-2.4-8.4-.3 1.5-.8 4.3c-.1.5-.4 1.6-1.2 2.6h5.5l.4-2.5h2l.6 2.5h2.5l-2.2-10.5h-2.1c-.7 0-1.2.4-1.4 1l-3.4 9.5h2.6zm17.8-6.8c0-1.1.9-1.6 2.4-1.6.9 0 1.9.2 2.8.6l.4-2.4c-.8-.3-1.9-.5-3-.5-3.2 0-5.4 1.7-5.4 4.1 0 1.8 1.6 2.8 2.8 3.4 1.2.6 1.7 1 1.7 1.6 0 .9-.9 1.3-2 1.3-1.2 0-2.5-.4-3.5-.9l-.4 2.4c1 .4 2.4.7 3.8.7 3.4 0 5.6-1.7 5.6-4.2 0-3.2-4.2-3.4-4.2-4.5zm11.5-3.7h-2.1c-.7 0-1.2.4-1.4 1l-4 9.5h2.8l.6-1.6h3.4l.3 1.6h2.5l-2.1-10.5zm-3.5 6.8l1.4-3.8.8 3.8h-2.2z'
        fill='#fff'
      />
    </svg>
  )
})

const MastercardSvgIcon = memo(function MastercardSvgIcon() {
  return (
    <svg viewBox='0 0 48 32' className='h-6 w-9'>
      <rect width='48' height='32' rx='4' fill='#000' />
      <circle cx='18' cy='16' r='10' fill='#EB001B' />
      <circle cx='30' cy='16' r='10' fill='#F79E1B' />
      <path d='M24 8.5a10 10 0 0 0 0 15 10 10 0 0 0 0-15z' fill='#FF5F00' />
    </svg>
  )
})

const AmexSvgIcon = memo(function AmexSvgIcon() {
  return (
    <svg viewBox='0 0 48 32' className='h-6 w-9'>
      <rect width='48' height='32' rx='4' fill='#006FCF' />
      <path
        d='M8 12h4l.8 2 .8-2h4v8h-3v-5l-1.3 3h-1.8l-1.3-3v5H8v-8zm12 0h6v2h-3v1h3v2h-3v1h3v2h-6v-8zm8 0h3l2 3 2-3h3l-3.5 4 3.5 4h-3l-2-3-2 3h-3l3.5-4-3.5-4z'
        fill='#fff'
      />
    </svg>
  )
})

const JcbSvgIcon = memo(function JcbSvgIcon() {
  return (
    <svg viewBox='0 0 48 32' className='h-6 w-9'>
      <rect width='48' height='32' rx='4' fill='#fff' />
      <rect x='6' y='6' width='10' height='20' rx='2' fill='#0E4C96' />
      <rect x='19' y='6' width='10' height='20' rx='2' fill='#E21836' />
      <rect x='32' y='6' width='10' height='20' rx='2' fill='#007940' />
      <text x='11' y='18' fontSize='6' fill='#fff' textAnchor='middle' fontWeight='bold'>
        J
      </text>
      <text x='24' y='18' fontSize='6' fill='#fff' textAnchor='middle' fontWeight='bold'>
        C
      </text>
      <text x='37' y='18' fontSize='6' fill='#fff' textAnchor='middle' fontWeight='bold'>
        B
      </text>
    </svg>
  )
})

const UnknownCardSvgIcon = memo(function UnknownCardSvgIcon() {
  return (
    <svg viewBox='0 0 48 32' className='h-6 w-9'>
      <rect width='48' height='32' rx='4' fill='#E5E7EB' />
      <rect x='6' y='10' width='12' height='8' rx='1' fill='#9CA3AF' />
      <rect x='22' y='12' width='20' height='2' rx='1' fill='#9CA3AF' />
      <rect x='22' y='18' width='14' height='2' rx='1' fill='#9CA3AF' />
    </svg>
  )
})

export const CardTypeIcon = memo(function CardTypeIcon({ type }: { type: CardType }) {
  switch (type) {
    case 'visa':
      return <VisaSvgIcon />
    case 'mastercard':
      return <MastercardSvgIcon />
    case 'amex':
      return <AmexSvgIcon />
    case 'jcb':
      return <JcbSvgIcon />
    default:
      return <UnknownCardSvgIcon />
  }
})

export const CheckmarkIcon = memo(function CheckmarkIcon() {
  return (
    <svg className='h-5 w-5 text-green-500' viewBox='0 0 20 20' fill='currentColor'>
      <path
        fillRule='evenodd'
        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
        clipRule='evenodd'
      />
    </svg>
  )
})

export const InfoIcon = memo(function InfoIcon() {
  return (
    <svg
      className='h-4 w-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400'
      viewBox='0 0 20 20'
      fill='currentColor'
    >
      <path
        fillRule='evenodd'
        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
        clipRule='evenodd'
      />
    </svg>
  )
})
