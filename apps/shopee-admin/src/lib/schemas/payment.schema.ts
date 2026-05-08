import { z } from 'zod'

export const PAYMENT_TYPE_OPTIONS = ['cod', 'bank_transfer', 'e_wallet', 'credit_card'] as const

export const paymentMethodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  icon: z.string().max(50).optional().or(z.literal('')),
  type: z.enum(PAYMENT_TYPE_OPTIONS, { errorMap: () => ({ message: 'Type is required' }) }),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
  instructions: z.string().max(1000).optional().or(z.literal('')),
})

export type PaymentMethodFormValues = z.infer<typeof paymentMethodSchema>
