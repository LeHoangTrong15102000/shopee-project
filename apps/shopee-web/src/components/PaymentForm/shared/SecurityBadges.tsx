import { memo } from 'react'

const ShieldIcon = memo(function ShieldIcon() {
  return (
    <svg className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
      <path
        fillRule='evenodd'
        d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
        clipRule='evenodd'
      />
    </svg>
  )
})

const LockIcon = memo(function LockIcon() {
  return (
    <svg className='h-5 w-5' viewBox='0 0 20 20' fill='currentColor'>
      <path
        fillRule='evenodd'
        d='M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z'
        clipRule='evenodd'
      />
    </svg>
  )
})

const SecurityBadges = memo(function SecurityBadges() {
  return (
    <div className='flex items-center justify-center gap-4 pt-4'>
      <div className='flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400'>
        <ShieldIcon />
        <span className='font-medium'>PCI DSS</span>
      </div>
      <div className='flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'>
        <LockIcon />
        <span className='font-medium'>SSL Secured</span>
      </div>
    </div>
  )
})

export default SecurityBadges
