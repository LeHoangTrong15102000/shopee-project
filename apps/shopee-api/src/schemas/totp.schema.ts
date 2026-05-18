import { z } from 'zod'

/**
 * Schema for POST /auth/2fa/verify-setup
 * Verifies a TOTP code during setup to enable 2FA.
 */
export const twoFactorVerifySetupSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(6, 'TOTP code must be 6 digits')
      .max(8, 'TOTP code must be 6 digits')
      .regex(/^\d+$/, 'TOTP code must contain only digits'),
  }),
})

/**
 * Schema for POST /auth/2fa/disable
 * Disables 2FA after verifying a TOTP code or backup code.
 */
export const twoFactorDisableSchema = z.object({
  body: z.object({
    code: z.string().min(1, 'Code is required'),
  }),
})

/**
 * Schema for POST /auth/2fa/backup-codes
 * Regenerates backup codes after verifying a TOTP code.
 */
export const twoFactorBackupCodesSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(6, 'TOTP code must be 6 digits')
      .max(8, 'TOTP code must be 6 digits')
      .regex(/^\d+$/, 'TOTP code must contain only digits'),
  }),
})

/**
 * Schema for POST /auth/2fa/complete
 * Completes the 2FA login flow with a partial token and TOTP/backup code.
 */
export const twoFactorCompleteSchema = z.object({
  body: z.object({
    partial_token: z.string().min(1, 'Partial token is required'),
    code: z.string().min(1, 'Code is required'),
  }),
})

export type TwoFactorVerifySetupInput = z.infer<typeof twoFactorVerifySetupSchema>['body']
export type TwoFactorDisableInput = z.infer<typeof twoFactorDisableSchema>['body']
export type TwoFactorBackupCodesInput = z.infer<typeof twoFactorBackupCodesSchema>['body']
export type TwoFactorCompleteInput = z.infer<typeof twoFactorCompleteSchema>['body']
