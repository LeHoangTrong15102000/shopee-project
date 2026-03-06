import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { UseFormReturn } from 'react-hook-form'
import Input from 'src/components/Input'
import { AddressType } from 'src/types/checkout.type'
import { ADDRESS_TYPE_OPTIONS, AddressSchemaFormData } from '../addressForm.constants'

interface AddressDetailsStepProps {
  form: UseFormReturn<AddressSchemaFormData>
  watchedAddressType: 'home' | 'office' | 'other'
  addressPreview: string
  showStreetSuggestions: boolean
  filteredStreetSuggestions: string[]
  onShowStreetSuggestions: (show: boolean) => void
  onStreetSelect: (street: string) => void
  onTypeSelect: (type: AddressType) => void
}

export default function AddressDetailsStep({
  form,
  watchedAddressType,
  addressPreview,
  showStreetSuggestions,
  filteredStreetSuggestions,
  onShowStreetSuggestions,
  onStreetSelect,
  onTypeSelect
}: AddressDetailsStepProps) {
  const { t } = useTranslation('address')
  const {
    register,
    formState: { errors }
  } = form

  return (
    <motion.div
      key='step3'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className='space-y-4'
    >
      <div className='mb-4'>
        <h4 className='text-lg font-medium text-gray-800 dark:text-gray-100'>{t('details.title')}</h4>
        <p className='text-sm text-gray-500 dark:text-gray-400'>{t('details.subtitle')}</p>
      </div>

      {/* Street Address with Autocomplete */}
      <div>
        <label className='mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200'>
          {t('form.street')} <span className='text-red-500'>*</span>
        </label>
        <div className='relative'>
          <input
            type='text'
            {...register('street')}
            placeholder={t('details.streetPlaceholder')}
            onFocus={() => onShowStreetSuggestions(true)}
            onBlur={() => setTimeout(() => onShowStreetSuggestions(false), 200)}
            className={`w-full rounded-lg border px-3 py-2.5 transition-colors focus:outline-hidden dark:bg-slate-700 dark:text-gray-100 ${
              errors.street ? 'border-red-300' : 'border-gray-300 focus:border-orange dark:border-slate-600'
            }`}
          />
          <AnimatePresence>
            {showStreetSuggestions && filteredStreetSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className='absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-700'
              >
                <div className='p-2 text-xs font-medium text-gray-500 dark:text-gray-400'>
                  {t('details.streetSuggestions')}
                </div>
                {filteredStreetSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type='button'
                    onClick={() => onStreetSelect(suggestion)}
                    className='flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-orange/5 dark:text-gray-200 dark:hover:bg-orange/10'
                  >
                    <svg
                      className='h-4 w-4 text-gray-400 dark:text-gray-500'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                      />
                    </svg>
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {errors.street && <p className='mt-1 text-xs text-red-500'>{errors.street.message}</p>}
      </div>

      {/* Address Preview */}
      {addressPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='rounded-lg bg-gray-50 p-3 dark:bg-slate-700'
        >
          <div className='flex items-start gap-2'>
            <svg className='mt-0.5 h-5 w-5 shrink-0 text-orange' fill='currentColor' viewBox='0 0 20 20'>
              <path
                fillRule='evenodd'
                d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
                clipRule='evenodd'
              />
            </svg>
            <div>
              <p className='text-xs font-medium text-gray-500 dark:text-gray-400'>{t('details.fullAddress')}</p>
              <p className='text-sm text-gray-700 dark:text-gray-200'>{addressPreview}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Address Type Selection */}
      <div>
        <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200'>
          {t('details.addressType')}
        </label>
        <div className='flex flex-wrap gap-2'>
          {ADDRESS_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type='button'
              onClick={() => onTypeSelect(option.value)}
              className={`flex items-center gap-2 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                watchedAddressType === option.value
                  ? 'border-orange bg-orange/5 text-orange dark:bg-orange/10'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-slate-600 dark:text-gray-300 dark:hover:border-slate-500'
              }`}
            >
              {option.icon}
              {t(option.labelKey as keyof typeof import('src/locales/en/address.json'))}
            </button>
          ))}
        </div>
        <input type='hidden' {...register('addressType')} />
      </div>

      {/* Custom Label for "Other" type */}
      <AnimatePresence>
        {watchedAddressType === 'other' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className='mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200'>
              {t('details.customLabel')}
            </label>
            <Input
              type='text'
              placeholder={t('details.customLabelPlaceholder')}
              register={register}
              name='label'
              errorMessage={errors.label?.message}
              classNameInput='w-full rounded-lg border border-gray-300 dark:border-slate-600 px-3 py-2.5 focus:border-orange focus:outline-hidden dark:bg-slate-700 dark:text-gray-100'
              classNameError='mt-1 min-h-4 text-xs text-red-500'
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Default Address Checkbox */}
      <div className='flex items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-slate-600'>
        <input
          type='checkbox'
          id='isDefault'
          {...register('isDefault')}
          className='h-5 w-5 rounded-sm border-gray-300 text-orange focus:ring-orange dark:border-slate-500 dark:bg-slate-700'
        />
        <label htmlFor='isDefault' className='flex-1'>
          <span className='block text-sm font-medium text-gray-700 dark:text-gray-200'>{t('details.setDefault')}</span>
          <span className='text-xs text-gray-500 dark:text-gray-400'>{t('details.setDefaultHint')}</span>
        </label>
      </div>

      {/* Map Preview Placeholder */}
      <div className='overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-slate-600 dark:bg-slate-700'>
        <div className='flex items-center justify-center p-6'>
          <div className='text-center'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1.5}
                d='M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
              />
            </svg>
            <p className='mt-2 text-sm font-medium text-gray-600 dark:text-gray-300'>{t('details.viewOnMap')}</p>
            <p className='text-xs text-gray-400 dark:text-gray-500'>{t('details.comingSoon')}</p>
            <button
              type='button'
              className='mt-3 inline-flex items-center gap-1 rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 dark:bg-slate-600 dark:text-gray-300'
              disabled
            >
              <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                />
              </svg>
              {t('details.pinLocation')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
