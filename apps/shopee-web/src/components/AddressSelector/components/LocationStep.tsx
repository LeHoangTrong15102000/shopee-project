import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { UseFormReturn } from 'react-hook-form'
import { District, vietnamProvinces, Ward } from 'src/data/vietnamLocations'
import { AddressSchemaFormData } from '../addressForm.constants'

interface LocationStepProps {
  form: UseFormReturn<AddressSchemaFormData>
  districts: District[]
  wards: Ward[]
  isLoadingDistricts: boolean
  isLoadingWards: boolean
  watchedProvinceId: string
  watchedDistrictId: string
  onProvinceChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onDistrictChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onWardChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

const SelectChevron = () => (
  <svg className='h-5 w-5 text-gray-400 dark:text-gray-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
  </svg>
)

const LoadingSpinner = () => (
  <svg className='h-5 w-5 animate-spin text-orange' fill='none' viewBox='0 0 24 24'>
    <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4' />
    <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z' />
  </svg>
)

export default function LocationStep({
  form,
  districts,
  wards,
  isLoadingDistricts,
  isLoadingWards,
  watchedProvinceId,
  watchedDistrictId,
  onProvinceChange,
  onDistrictChange,
  onWardChange
}: LocationStepProps) {
  const { t } = useTranslation('address')
  const {
    register,
    watch,
    formState: { errors }
  } = form

  return (
    <motion.div
      key='step2'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className='space-y-4'
    >
      <div className='mb-4'>
        <h4 className='text-lg font-medium text-gray-800 dark:text-gray-100'>{t('location.title')}</h4>
        <p className='text-sm text-gray-500 dark:text-gray-400'>{t('location.subtitle')}</p>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        {/* Province Select */}
        <div>
          <label className='mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200'>
            {t('form.province')} <span className='text-red-500'>*</span>
          </label>
          <div className='relative'>
            <select
              value={watchedProvinceId || ''}
              onChange={onProvinceChange}
              className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-10 transition-colors focus:outline-hidden dark:bg-slate-700 dark:text-gray-100 ${
                errors.provinceId ? 'border-red-300' : 'border-gray-300 focus:border-orange dark:border-slate-600'
              }`}
            >
              <option value=''>{t('location.selectProvince')}</option>
              {vietnamProvinces.map((province) => (
                <option key={province.id} value={province.id}>
                  {province.name}
                </option>
              ))}
            </select>
            <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
              <SelectChevron />
            </div>
          </div>
          {errors.provinceId && <p className='mt-1 text-xs text-red-500'>{errors.provinceId.message}</p>}
        </div>

        {/* District Select */}
        <div>
          <label className='mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200'>
            {t('form.district')} <span className='text-red-500'>*</span>
          </label>
          <div className='relative'>
            <select
              value={watchedDistrictId || ''}
              onChange={onDistrictChange}
              disabled={!watchedProvinceId || isLoadingDistricts}
              className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-10 transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-slate-700 dark:text-gray-100 dark:disabled:bg-slate-600 ${
                errors.districtId ? 'border-red-300' : 'border-gray-300 focus:border-orange dark:border-slate-600'
              }`}
            >
              <option value=''>{isLoadingDistricts ? t('location.loading') : t('location.selectDistrict')}</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
              {isLoadingDistricts ? <LoadingSpinner /> : <SelectChevron />}
            </div>
          </div>
          {errors.districtId && <p className='mt-1 text-xs text-red-500'>{errors.districtId.message}</p>}
        </div>

        {/* Ward Select */}
        <div>
          <label className='mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200'>
            {t('form.ward')} <span className='text-red-500'>*</span>
          </label>
          <div className='relative'>
            <select
              value={watch('wardId') || ''}
              onChange={onWardChange}
              disabled={!watchedDistrictId || isLoadingWards}
              className={`w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-10 transition-colors focus:outline-hidden disabled:cursor-not-allowed disabled:bg-gray-100 dark:bg-slate-700 dark:text-gray-100 dark:disabled:bg-slate-600 ${
                errors.wardId ? 'border-red-300' : 'border-gray-300 focus:border-orange dark:border-slate-600'
              }`}
            >
              <option value=''>{isLoadingWards ? t('location.loading') : t('location.selectWard')}</option>
              {wards.map((ward) => (
                <option key={ward.id} value={ward.id}>
                  {ward.name}
                </option>
              ))}
            </select>
            <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3'>
              {isLoadingWards ? <LoadingSpinner /> : <SelectChevron />}
            </div>
          </div>
          {errors.wardId && <p className='mt-1 text-xs text-red-500'>{errors.wardId.message}</p>}
        </div>
      </div>

      {/* Hidden inputs for form values */}
      <input type='hidden' {...register('province')} />
      <input type='hidden' {...register('provinceId')} />
      <input type='hidden' {...register('district')} />
      <input type='hidden' {...register('districtId')} />
      <input type='hidden' {...register('ward')} />
      <input type='hidden' {...register('wardId')} />
    </motion.div>
  )
}
