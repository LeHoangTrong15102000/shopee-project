import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import omit from 'lodash/omit'
import { useContext } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import userApi, { BodyUpdateProfile, BodySetPassword } from 'src/apis/user.api'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import PasswordStrengthMeter from 'src/components/PasswordStrengthMeter'
import SEO from 'src/components/SEO'
import { AppContext } from 'src/contexts/app.context'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { ErrorResponseApi } from 'src/types/utils.type'
import { UserSchema, baseUserSchema } from 'src/utils/rules'
import { isAxiosUnprocessableEntityError } from 'src/utils/utils'
import { setProfileToLS, setAccessTokenToLS, setRefreshTokenToLS } from 'src/utils/auth'
import { setInMemoryTokens } from 'src/utils/http'
import { z } from 'zod'
import i18n from 'src/i18n/i18n'

// ── Change-password form (requires current password) ────────────────────────

type ChangeFormData = Pick<UserSchema, 'password' | 'new_password' | 'confirm_password'>

const changePasswordSchema = baseUserSchema
  .pick({ password: true, new_password: true, confirm_password: true })
  .superRefine((data, ctx) => {
    if (data.new_password && data.confirm_password !== data.new_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: i18n.t('common:validation.passwordMismatch'),
        path: ['confirm_password'],
      })
    }
  })

// ── Set-password form (no current password required) ────────────────────────

type SetFormData = {
  new_password: string
  confirm_password: string
}

const setPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, i18n.t('validation:password.length'))
      .max(160, i18n.t('validation:password.length'))
      .regex(/[A-Z]/, i18n.t('validation:password.uppercase') || 'Phải có chữ hoa')
      .regex(/[a-z]/, i18n.t('validation:password.lowercase') || 'Phải có chữ thường')
      .regex(/[0-9]/, i18n.t('validation:password.number') || 'Phải có số')
      .regex(/[^A-Za-z0-9]/, i18n.t('validation:password.special') || 'Phải có ký tự đặc biệt'),
    confirm_password: z.string().min(1, i18n.t('validation:password.required')),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: i18n.t('common:validation.passwordMismatch'),
    path: ['confirm_password'],
  })

// ── Shared security tips component ──────────────────────────────────────────

interface SecurityTipsProps {
  newPassword: string
  reducedMotion: boolean
  tipKey: string
  requirementsTitleKey: string
}

const SecurityTips = ({
  newPassword,
  reducedMotion,
  tipKey,
  requirementsTitleKey,
}: SecurityTipsProps) => {
  const { t: tRaw } = useTranslation('user')
  // Dynamic keys from props — cast via unknown to avoid over-strict i18n key union check
  const t = tRaw as unknown as (key: string) => string

  const requirements = [
    {
      label: t('changePassword.requirements.minLength'),
      check: (newPassword?.length ?? 0) >= 6,
    },
    {
      label: t('changePassword.requirements.uppercase'),
      check: /[A-Z]/.test(newPassword ?? ''),
    },
    {
      label: t('changePassword.requirements.lowercase'),
      check: /[a-z]/.test(newPassword ?? ''),
    },
    { label: t('changePassword.requirements.number'), check: /\d/.test(newPassword ?? '') },
    {
      label: t('changePassword.requirements.special'),
      check: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(newPassword ?? ''),
    },
  ]

  return (
    <motion.div
      className="mb-6 shrink-0 md:mb-0 md:w-[320px]"
      initial={reducedMotion ? undefined : { opacity: 0, x: 10 }}
      animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-5 dark:border-slate-600 dark:bg-slate-700/50">
        <div className="mb-3 flex items-center gap-2">
          <svg
            className="h-5 w-5 text-blue-500 dark:text-blue-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
          <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            {t(requirementsTitleKey)}
          </h3>
        </div>
        <ul
          className="space-y-2 text-xs text-gray-600 dark:text-gray-300"
          aria-label={t('changePassword.requirements.aria')}
        >
          {requirements.map((req, index) => (
            <li
              key={index}
              className="flex items-center gap-2"
              aria-label={`${req.label}: ${req.check ? t('changePassword.requirements.met') : t('changePassword.requirements.notMet')}`}
            >
              {req.check ? (
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-green-500 dark:text-green-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-gray-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
              )}
              <span
                className={
                  req.check ? 'text-green-600 line-through opacity-70 dark:text-green-400' : ''
                }
              >
                {req.label}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-blue-100 pt-3 dark:border-slate-600">
          <p className="text-xs text-gray-500 italic dark:text-gray-400">{t(tipKey)}</p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Set-password sub-form component ─────────────────────────────────────────

const SetPasswordForm = () => {
  const { t } = useTranslation('user')
  const { profile, setProfile } = useContext(AppContext)
  const reducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<SetFormData>({
    defaultValues: { new_password: '', confirm_password: '' },
    resolver: zodResolver(setPasswordSchema),
  })

  const watchedNewPassword = watch('new_password', '')

  const setPasswordMutation = useMutation({
    mutationFn: (body: BodySetPassword) => userApi.setPassword(body),
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await setPasswordMutation.mutateAsync(data)
      toast.success(res.data.message || t('setPassword.success'))
      reset()
      // Persist fresh tokens so the current session stays alive
      const tokenData = res.data.data
      if (tokenData?.access_token && tokenData?.refresh_token) {
        setAccessTokenToLS(tokenData.access_token)
        setRefreshTokenToLS(tokenData.refresh_token)
        setInMemoryTokens(tokenData.access_token, tokenData.refresh_token)
      }
      // refresh in-context profile so the form switches to change mode
      if (profile) {
        const updatedProfile = { ...profile, hasPassword: true }
        setProfile(updatedProfile)
        setProfileToLS(updatedProfile)
      }
    } catch (error) {
      if (isAxiosUnprocessableEntityError<ErrorResponseApi<SetFormData>>(error)) {
        const formError = error.response?.data.data
        if (formError) {
          Object.keys(formError).forEach((key) => {
            setError(key as keyof SetFormData, {
              message: formError[key as keyof SetFormData],
              type: 'Server',
            })
          })
        }
      }
    }
  })

  return (
    <form className="mt-8 flex flex-col-reverse md:flex-row md:items-start" onSubmit={onSubmit}>
      <motion.div
        className="mt-6 grow md:mt-0 md:pr-12"
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* New password */}
        <motion.div
          className="mt-2 flex flex-col flex-wrap sm:flex-row"
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <div className="truncate pt-3 text-gray-500 capitalize sm:w-[30%] sm:text-right dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <span>{t('setPassword.newPassword')}</span>
            </span>
          </div>
          <div className="sm:w-[70%] sm:pl-5">
            <Input
              register={register}
              name="new_password"
              type="password"
              errorMessage={errors.new_password?.message}
              autoComplete="new-password"
              classNameInput="w-full rounded-xs border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-gray-400 dark:bg-slate-900 dark:text-gray-100"
              className="relative"
              disableFloatingLabel
            />
          </div>
        </motion.div>
        {/* Confirm password */}
        <motion.div
          className="mt-2 flex flex-col flex-wrap sm:flex-row"
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <div className="truncate pt-3 text-gray-500 capitalize sm:w-[30%] sm:text-right dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span>{t('setPassword.confirmPassword')}</span>
            </span>
          </div>
          <div className="sm:w-[70%] sm:pl-5">
            <Input
              register={register}
              name="confirm_password"
              type="password"
              errorMessage={errors.confirm_password?.message}
              autoComplete="new-password"
              classNameInput="w-full rounded-xs border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-gray-400 dark:bg-slate-900 dark:text-gray-100"
              className="relative"
              disableFloatingLabel
            />
            <PasswordStrengthMeter password={watchedNewPassword ?? ''} className="mt-2" />
          </div>
        </motion.div>
        {/* Submit */}
        <motion.div
          className="mt-5 flex flex-col flex-wrap sm:flex-row"
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          <div className="truncate pt-3 capitalize sm:w-[30%] sm:text-right" />
          <div className="w-full sm:w-[70%] sm:pl-5">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={setPasswordMutation.isPending}
              className="flex h-11 min-w-[140px] items-center justify-center rounded-md px-8 text-sm font-medium shadow-xs transition-shadow hover:shadow-md"
            >
              {setPasswordMutation.isPending
                ? t('setPassword.processing')
                : t('setPassword.confirm')}
            </Button>
          </div>
        </motion.div>
      </motion.div>

      <SecurityTips
        newPassword={watchedNewPassword ?? ''}
        reducedMotion={reducedMotion}
        tipKey="changePassword.tip"
        requirementsTitleKey="changePassword.requirements.title"
      />
    </form>
  )
}

// ── Change-password sub-form component ──────────────────────────────────────

const ChangePasswordForm = () => {
  const { t } = useTranslation('user')
  const reducedMotion = useReducedMotion()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors },
  } = useForm<ChangeFormData>({
    defaultValues: { password: '', new_password: '', confirm_password: '' },
    resolver: zodResolver(changePasswordSchema),
  })

  const watchedNewPassword = watch('new_password', '')

  const updateProfileMutation = useMutation({
    mutationFn: (body: BodyUpdateProfile) => userApi.updateProfile(body),
  })

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await updateProfileMutation.mutateAsync(omit(data, ['confirm_password']))
      toast.success(res.data.message)
      reset()
      // Persist fresh tokens so the current session stays alive after password change
      const responseData = res.data.data
      if (responseData?.access_token && responseData?.refresh_token) {
        setAccessTokenToLS(responseData.access_token)
        setRefreshTokenToLS(responseData.refresh_token)
        setInMemoryTokens(responseData.access_token, responseData.refresh_token)
      }
    } catch (error) {
      if (isAxiosUnprocessableEntityError<ErrorResponseApi<ChangeFormData>>(error)) {
        const formError = error.response?.data.data
        if (formError) {
          Object.keys(formError).forEach((key) => {
            setError(key as keyof ChangeFormData, {
              message: formError[key as keyof ChangeFormData],
              type: 'Server',
            })
          })
        }
      }
    }
  })

  return (
    <form className="mt-8 flex flex-col-reverse md:flex-row md:items-start" onSubmit={onSubmit}>
      <motion.div
        className="mt-6 grow md:mt-0 md:pr-12"
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Old password */}
        <motion.div
          className="mt-2 flex flex-col flex-wrap sm:flex-row"
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="truncate pt-3 text-gray-500 capitalize sm:w-[30%] sm:text-right dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>
              <span>{t('changePassword.oldPassword')}</span>
            </span>
          </div>
          <div className="sm:w-[70%] sm:pl-5">
            <Input
              register={register}
              name="password"
              type="password"
              errorMessage={errors.password?.message}
              autoComplete="on"
              classNameInput="w-full rounded-xs border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-gray-400 dark:bg-slate-900 dark:text-gray-100"
              className="relative"
              disableFloatingLabel
            />
          </div>
        </motion.div>
        {/* New password */}
        <motion.div
          className="mt-2 flex flex-col flex-wrap sm:flex-row"
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <div className="truncate pt-3 text-gray-500 capitalize sm:w-[30%] sm:text-right dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
              <span>{t('changePassword.newPassword')}</span>
            </span>
          </div>
          <div className="sm:w-[70%] sm:pl-5">
            <Input
              register={register}
              name="new_password"
              type="password"
              errorMessage={errors.new_password?.message}
              autoComplete="on"
              classNameInput="w-full rounded-xs border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-gray-400 dark:bg-slate-900 dark:text-gray-100"
              className="relative"
              disableFloatingLabel
            />
          </div>
        </motion.div>
        {/* Confirm password */}
        <motion.div
          className="mt-2 flex flex-col flex-wrap sm:flex-row"
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <div className="truncate pt-3 text-gray-500 capitalize sm:w-[30%] sm:text-right dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span>{t('changePassword.confirmPassword')}</span>
            </span>
          </div>
          <div className="sm:w-[70%] sm:pl-5">
            <Input
              register={register}
              name="confirm_password"
              type="password"
              errorMessage={errors.confirm_password?.message}
              autoComplete="on"
              classNameInput="w-full rounded-xs border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-gray-400 dark:bg-slate-900 dark:text-gray-100"
              className="relative"
              disableFloatingLabel
            />
            <PasswordStrengthMeter password={watchedNewPassword ?? ''} className="mt-2" />
          </div>
        </motion.div>
        {/* Submit */}
        <motion.div
          className="mt-5 flex flex-col flex-wrap sm:flex-row"
          initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
        >
          <div className="truncate pt-3 capitalize sm:w-[30%] sm:text-right" />
          <div className="w-full sm:w-[70%] sm:pl-5">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={updateProfileMutation.isPending}
              className="flex h-11 min-w-[140px] items-center justify-center rounded-md px-8 text-sm font-medium shadow-xs transition-shadow hover:shadow-md"
            >
              {updateProfileMutation.isPending
                ? t('changePassword.processing')
                : t('changePassword.confirm')}
            </Button>
          </div>
        </motion.div>
      </motion.div>

      <SecurityTips
        newPassword={watchedNewPassword ?? ''}
        reducedMotion={reducedMotion}
        tipKey="changePassword.tip"
        requirementsTitleKey="changePassword.requirements.title"
      />
    </form>
  )
}

// ── Main adaptive component ─────────────────────────────────────────────────

const ChangePassword = () => {
  const { t } = useTranslation('user')
  const { profile } = useContext(AppContext)
  const reducedMotion = useReducedMotion()

  // D4: hasPassword !== true → create-password form (covers false + undefined legacy records)
  const isCreateMode = profile?.hasPassword !== true

  return (
    <motion.div
      className="rounded-md bg-white px-2 pb-10 shadow-sm md:px-7 md:pb-20 dark:bg-slate-800"
      initial={reducedMotion ? undefined : { opacity: 0, y: 15 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <SEO title={isCreateMode ? t('setPassword.title') : t('changePassword.title')} noindex />
      {/* Header */}
      <motion.div
        className="border-b border-b-gray-100 py-6 text-center sm:text-left dark:border-b-slate-600"
        initial={reducedMotion ? undefined : { opacity: 0, x: -10 }}
        animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center justify-center gap-3 sm:justify-start">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange/10 dark:bg-orange-400/10">
            <svg
              className="h-5 w-5 text-orange dark:text-orange-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-medium text-gray-700 capitalize dark:text-gray-200">
              {isCreateMode ? t('setPassword.title') : t('changePassword.title')}
            </h1>
            <div className="mt-0.75 text-[.875rem] text-gray-500 dark:text-gray-400">
              {isCreateMode ? t('setPassword.description') : t('changePassword.description')}
            </div>
          </div>
        </div>
        <div className="mt-4 h-0.5 bg-linear-to-r from-orange/60 via-orange/20 to-transparent dark:from-orange-400/50 dark:via-orange-400/10 dark:to-transparent" />
      </motion.div>

      {/* Adaptive form */}
      {isCreateMode ? <SetPasswordForm /> : <ChangePasswordForm />}
    </motion.div>
  )
}

export default ChangePassword
