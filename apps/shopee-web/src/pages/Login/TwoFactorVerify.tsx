import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useContext, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import { z } from 'zod'
import SEO from 'src/components/SEO'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import path from 'src/constant/path'
import { AppContext } from 'src/contexts/app.context'
import totpApi, { persistTotpTokens } from 'src/apis/totp.api'
import userApi from 'src/apis/user.api'
import { setProfileToLS } from 'src/utils/auth'
import { isAxiosUnprocessableEntityError } from 'src/utils/utils'
import { ErrorResponseApi } from 'src/types/utils.type'

const PARTIAL_TOKEN_TTL_SECONDS = 300

// Zod schemas for the two modes
const totpSchema = z.object({
  code: z
    .string()
    .min(6, 'twoFactor.errors.codeRequired')
    .max(6, 'twoFactor.errors.codeTooLong')
    .regex(/^\d{6}$/, 'twoFactor.errors.codeDigitsOnly'),
})

const backupSchema = z.object({
  code: z.string().min(1, 'twoFactor.errors.codeRequired'),
})

type FormData = { code: string }

interface LocationState {
  partial_token?: string
}

export default function TwoFactorVerify() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const qc = useQueryClient()

  const partial_token = (location.state as LocationState | null)?.partial_token

  const [useBackupCode, setUseBackupCode] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(PARTIAL_TOKEN_TTL_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Keep a ref to the active schema so the stable resolver always validates
  // against the current mode without requiring useForm to remount.
  const schemaRef = useRef(useBackupCode ? backupSchema : totpSchema)
  schemaRef.current = useBackupCode ? backupSchema : totpSchema

  // Countdown — always run unconditionally; no-op if no partial_token
  useEffect(() => {
    if (!partial_token) return
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [partial_token])

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    // Stable resolver: delegates to schemaRef.current so validation switches
    // to the active schema when the user toggles to backup-code mode, without
    // remounting the form.
    resolver: (...args) => zodResolver(schemaRef.current)(...args),
    defaultValues: { code: '' },
  })

  // Reset form when switching between TOTP and backup code mode
  const handleToggleMode = () => {
    setUseBackupCode((prev) => !prev)
    reset({ code: '' })
  }

  const completeMutation = useMutation({
    mutationFn: (body: FormData) =>
      totpApi.complete({ partial_token: partial_token ?? '', code: body.code }),
  })

  const getMeMutation = useMutation({
    mutationFn: () => userApi.getProfile(),
  })

  // Redirect to login if no partial_token in state (e.g., direct URL visit / refresh)
  if (!partial_token) {
    return <Navigate to={path.login} replace />
  }

  const expired = secondsLeft <= 0

  const onSubmit = handleSubmit((data) => {
    if (expired) return
    completeMutation.mutate(data, {
      onSuccess: (res) => {
        const tokenData = res.data.data
        // /complete returns only tokens, no user — persist then fetch /me
        persistTotpTokens(tokenData)
        getMeMutation.mutate(undefined, {
          onSuccess: (meRes) => {
            const user = meRes.data.data
            setProfileToLS(user)
            setIsAuthenticated(true)
            setProfile(user)
            qc.invalidateQueries({ queryKey: ['profile'] })
            toast.success(t('twoFactor.success'), { autoClose: 3000 })
            navigate('/')
          },
          onError: () => {
            toast.error(t('twoFactor.errors.profileFetchFailed'), { autoClose: 3000 })
          },
        })
      },
      onError: (error) => {
        if (isAxiosUnprocessableEntityError<ErrorResponseApi<{ code?: string }>>(error)) {
          const serverError = error.response?.data?.data
          if (serverError?.code) {
            setError('code', { message: serverError.code, type: 'Server' })
          } else {
            setError('code', {
              message: error.response?.data?.message ?? t('twoFactor.errors.invalidCode'),
              type: 'Server',
            })
          }
        } else {
          setError('code', {
            message: t('twoFactor.errors.invalidCode'),
            type: 'Server',
          })
        }
      },
    })
  })

  const isPending = completeMutation.isPending || getMeMutation.isPending

  const minutesLeft = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const countdownDisplay = `${minutesLeft}:${String(secs).padStart(2, '0')}`

  return (
    <div className="relative bg-orange">
      <SEO title={t('twoFactor.meta.title')} description={t('twoFactor.meta.description')} />
      <div className="relative container flex min-h-[60vh] items-center justify-center py-12 lg:py-20">
        <div className="w-full max-w-md">
          <form
            className="rounded-sm bg-white p-10 shadow-xs dark:bg-slate-800 dark:shadow-slate-900/50"
            onSubmit={onSubmit}
            noValidate
          >
            <h1 className="mb-2 text-2xl text-gray-900 dark:text-gray-100">
              {t('twoFactor.title')}
            </h1>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
              {useBackupCode ? t('twoFactor.hintBackup') : t('twoFactor.hintTotp')}
            </p>

            {/* Countdown */}
            <div
              aria-live="polite"
              className={`mb-4 text-sm font-medium ${expired ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
            >
              {expired
                ? t('twoFactor.expired')
                : t('twoFactor.expiresIn', { time: countdownDisplay })}
            </div>

            {expired ? (
              <div className="space-y-3">
                <p className="text-sm text-red-500">{t('twoFactor.expiredMessage')}</p>
                <Link
                  to={path.login}
                  className="inline-block w-full rounded-md bg-red-500 px-4 py-3 text-center text-sm text-white hover:bg-red-600"
                >
                  {t('twoFactor.backToLogin')}
                </Link>
              </div>
            ) : (
              <>
                <Input
                  className="relative mb-4"
                  classNameInput="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-slate-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  type="text"
                  name="code"
                  register={register}
                  placeholder={
                    useBackupCode
                      ? t('twoFactor.placeholderBackup')
                      : t('twoFactor.placeholderTotp')
                  }
                  errorMessage={errors.code?.message}
                  disabled={expired}
                  autoComplete="one-time-code"
                  inputMode={useBackupCode ? 'text' : 'numeric'}
                  maxLength={useBackupCode ? undefined : 6}
                />

                <Button
                  isLoading={isPending}
                  disabled={isPending || expired}
                  type="submit"
                  className="mb-3 flex w-full items-center justify-center bg-red-500 px-2 py-4 text-center text-sm text-white uppercase hover:bg-red-600"
                >
                  {t('twoFactor.submit')}
                </Button>

                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {useBackupCode ? t('twoFactor.useTotp') : t('twoFactor.useBackupCode')}
                </button>

                <div className="mt-4 text-center">
                  <Link
                    to={path.login}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {t('twoFactor.backToLogin')}
                  </Link>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
