import { AddressType } from 'src/types/checkout.type'
import { z } from 'zod'
import i18n from 'src/i18n/i18n'

export const addressSchema = z.object({
  fullName: z.string().min(1, i18n.t('address:form.fullName.required')).max(100, i18n.t('address:form.fullName.max')),
  phone: z
    .string()
    .min(1, i18n.t('address:form.phone.required'))
    .regex(/^(0|\+84)[0-9]{9,10}$/, i18n.t('address:form.phone.invalid')),
  provinceId: z.string().min(1, i18n.t('address:form.province.required')),
  province: z.string().min(1, i18n.t('address:form.province.required')),
  districtId: z.string().min(1, i18n.t('address:form.district.required')),
  district: z.string().min(1, i18n.t('address:form.district.required')),
  wardId: z.string().min(1, i18n.t('address:form.ward.required')),
  ward: z.string().min(1, i18n.t('address:form.ward.required')),
  street: z.string().min(1, i18n.t('address:form.street.required')).max(200, i18n.t('address:form.street.max')),
  addressType: z.enum(['home', 'office', 'other']),
  label: z.string().max(50, i18n.t('address:form.label.max')).optional(),
  isDefault: z.boolean().optional()
})

export type AddressSchemaFormData = z.infer<typeof addressSchema>

export const FORM_STEPS = [
  { id: 1, titleKey: 'step.contact' },
  { id: 2, titleKey: 'step.location' },
  { id: 3, titleKey: 'step.details' }
]

export const ADDRESS_TYPE_OPTIONS: { value: AddressType; labelKey: string; icon: React.ReactNode }[] = [
  {
    value: 'home',
    labelKey: 'type.home',
    icon: (
      <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
        <path d='M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z' />
      </svg>
    )
  },
  {
    value: 'office',
    labelKey: 'type.office',
    icon: (
      <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
          fillRule='evenodd'
          d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z'
          clipRule='evenodd'
        />
      </svg>
    )
  },
  {
    value: 'other',
    labelKey: 'type.other',
    icon: (
      <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
          fillRule='evenodd'
          d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
          clipRule='evenodd'
        />
      </svg>
    )
  }
]

export const formatPhoneNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '')
  if (cleaned.length <= 4) return cleaned
  if (cleaned.length <= 7) return `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`
  return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7, 10)}`
}
