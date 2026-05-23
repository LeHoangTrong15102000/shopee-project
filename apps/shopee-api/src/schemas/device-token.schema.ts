/**
 * Device token validation schemas.
 */
import { z } from 'zod'
import { mongoIdSchema } from './common.schema'
import { DEVICE_PLATFORM } from '@database/models/device-token.model'

const platformValues = Object.values(DEVICE_PLATFORM) as [string, ...string[]]

export const registerDeviceTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Device token is required'),
    platform: z.enum(platformValues as [string, ...string[]]),
    deviceName: z.string().max(200).optional(),
  }),
})

export const deleteDeviceTokenSchema = z.object({
  params: z.object({
    id: mongoIdSchema,
  }),
})

export type RegisterDeviceTokenInput = z.infer<typeof registerDeviceTokenSchema>['body']
