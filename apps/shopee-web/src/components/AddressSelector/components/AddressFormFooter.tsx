import { useTranslation } from 'react-i18next'
import Button from 'src/components/Button'

interface AddressFormFooterProps {
  currentStep: number
  isLoading: boolean
  canProceedToNext: boolean
  isEditing: boolean
  onBack: () => void
  onNext: () => void
  onClose: () => void
  onSubmit: () => void
}

export default function AddressFormFooter({
  currentStep,
  isLoading,
  canProceedToNext,
  isEditing,
  onBack,
  onNext,
  onClose,
  onSubmit
}: AddressFormFooterProps) {
  const { t } = useTranslation('address')

  return (
    <div className='flex items-center justify-between border-t border-gray-100 bg-linear-to-b from-white to-gray-50 px-6 py-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/50'>
      <div>
        {currentStep > 1 && (
          <Button
            type='button'
            onClick={onBack}
            className='flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-all hover:bg-gray-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
          >
            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
            </svg>
            {t('footer.back')}
          </Button>
        )}
      </div>
      <div className='flex gap-3'>
        <Button
          type='button'
          onClick={onClose}
          className='rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-xs transition-all hover:bg-gray-50 hover:shadow-sm dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600'
        >
          {t('footer.cancel')}
        </Button>
        {currentStep < 3 ? (
          <Button
            type='button'
            onClick={onNext}
            disabled={!canProceedToNext}
            className='inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange to-orange/90 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange/30 transition-all hover:shadow-xl hover:shadow-orange/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none'
          >
            <span className='inline-flex items-center leading-none'>{t('footer.next')}</span>
            <svg className='h-4 w-4 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </Button>
        ) : (
          <Button
            type='submit'
            onClick={onSubmit}
            disabled={isLoading}
            isLoading={isLoading}
            className='flex items-center gap-1.5 rounded-xl bg-linear-to-r from-orange to-orange/90 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange/30 transition-all hover:shadow-xl hover:shadow-orange/40 disabled:opacity-50 disabled:shadow-none'
          >
            <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
            </svg>
            {isEditing ? t('footer.update') : t('footer.add')}
          </Button>
        )}
      </div>
    </div>
  )
}
