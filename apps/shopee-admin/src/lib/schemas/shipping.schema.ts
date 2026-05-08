import { z } from 'zod'

export const shippingMethodSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),
    description: z.string().max(500).optional().or(z.literal('')),
    price: z.coerce.number().min(0, 'Price must be >= 0'),
    estimated_days_min: z.coerce.number().int().min(0, 'Min days must be >= 0'),
    estimated_days_max: z.coerce.number().int().min(0, 'Max days must be >= 0'),
    icon: z.string().max(50).optional().or(z.literal('')),
    is_active: z.boolean().default(true),
    sort_order: z.coerce.number().int().min(0).default(0),
  })
  .refine((data) => data.estimated_days_min <= data.estimated_days_max, {
    message: 'Min days must be <= max days',
    path: ['estimated_days_min'],
  })

export type ShippingMethodFormValues = z.infer<typeof shippingMethodSchema>
