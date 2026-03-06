import { useTranslation } from 'react-i18next'

interface AddressFormHeaderProps {
  isEditing: boolean
  onClose: () => void
}

export default function AddressFormHeader({ isEditing, onClose }: AddressFormHeaderProps) {
  const { t } = useTranslation('address')

  return (
    <div className='relative bg-linear-to-r from-orange to-orange/80 px-6 py-5'>
      <div
        className='absolute inset-0 bg-white/5'
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)'
        }}
      />
      <div className='relative flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs'>
            <svg className='h-5 w-5 text-white' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
              />
              <path strokeLinecap='round' strokeLinejoin='round' d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
            </svg>
          </div>
          <div>
            <h3 className='text-xl font-bold text-white'>{isEditing ? t('header.editTitle') : t('header.addTitle')}</h3>
            <p className='text-sm text-white/80'>{t('header.subtitle')}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className='flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-xs transition-all hover:scale-105 hover:bg-white/30'
          aria-label={t('header.close')}
        >
          <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
          </svg>
        </button>
      </div>
    </div>
  )
}
