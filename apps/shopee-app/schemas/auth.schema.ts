import { z } from 'zod';
import i18n from '@/config/i18n';

const t = (key: string) => i18n.t(key);

export const signInSchema = z.object({
  email: z.string().min(1, { message: t('AUTH_VALIDATION_EMAIL_REQUIRED') }).email({ message: t('AUTH_VALIDATION_EMAIL_INVALID') }),
  password: z.string().min(6, { message: t('AUTH_VALIDATION_PASSWORD_LENGTH') }).max(160, { message: t('AUTH_VALIDATION_PASSWORD_LENGTH') }),
});

export type SignInFormData = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    email: z.string().min(1, { message: t('AUTH_VALIDATION_EMAIL_REQUIRED') }).email({ message: t('AUTH_VALIDATION_EMAIL_INVALID') }),
    password: z.string().min(6, { message: t('AUTH_VALIDATION_PASSWORD_LENGTH') }).max(160, { message: t('AUTH_VALIDATION_PASSWORD_LENGTH') }),
    confirm_password: z.string().min(6, { message: t('AUTH_VALIDATION_PASSWORD_LENGTH') }).max(160, { message: t('AUTH_VALIDATION_PASSWORD_LENGTH') }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: t('AUTH_VALIDATION_PASSWORD_MISMATCH'),
    path: ['confirm_password'],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;
