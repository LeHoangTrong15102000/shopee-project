import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from 'src/components/ui/button'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from 'src/components/ui/card'
import { useAuthStore } from 'src/stores/auth.store'
import settingsApi from 'src/apis/settings.api'
import totpApi, { persistTotpTokens } from 'src/apis/totp.api'
import { clearLS } from 'src/utils/http'
import { AxiosError } from 'axios'
import { ROUTES } from 'src/constants/routes'

const TOTP_TTL = 300 // 5 minutes in seconds

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

const totpSchema = z.object({
  code: z.string().min(6, 'Code must be at least 6 characters').max(32, 'Code is too long'),
})

const backupSchema = z.object({
  code: z.string().min(1, 'Please enter your backup code'),
})

type TotpForm = { code: string }

export default function TwoFactorVerifyPage() {
  const { t } = useTranslation('login')
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  const state = location.state as { partial_token?: string; from?: string } | null
  const partial_token = state?.partial_token
  const from = state?.from ?? '/'

  const [isLoading, setIsLoading] = useState(false)
  const [useBackup, setUseBackup] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(TOTP_TTL)
  const [expired, setExpired] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Keep a ref to the active schema so the stable resolver always validates
  // against the current mode without requiring useForm to remount.
  const schemaRef = useRef(useBackup ? backupSchema : totpSchema)
  schemaRef.current = useBackup ? backupSchema : totpSchema

  // Redirect if no partial_token in state
  useEffect(() => {
    if (!partial_token) {
      navigate(ROUTES.LOGIN, { replace: true })
    }
  }, [partial_token, navigate])

  // 5-minute countdown
  useEffect(() => {
    if (!partial_token) return
    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          setExpired(true)
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
  } = useForm<TotpForm>({
    // Stable resolver: delegates to schemaRef.current so validation switches
    // to the active schema when the user toggles to backup-code mode, without
    // remounting the form.
    resolver: (...args) => zodResolver(schemaRef.current)(...args),
    defaultValues: { code: '' },
  })

  const onSubmit = async (data: TotpForm) => {
    if (!partial_token || expired) return
    setIsLoading(true)
    try {
      const res = await totpApi.complete({ partial_token, code: data.code })
      const tokens = res.data.data
      // Persist tokens so subsequent HTTP requests authenticate correctly
      persistTotpTokens(tokens)

      // Fetch the actual user profile (complete returns no user)
      const meRes = await settingsApi.getProfile()
      const user = meRes.data.data

      // Admin role check — block non-admins even if they pass 2FA
      if (!user.roles?.includes('Admin')) {
        clearLS()
        toast.error(t('errors.accessDenied'))
        navigate(ROUTES.LOGIN, { replace: true })
        return
      }

      login(tokens.access_token, tokens.refresh_token, user)
      toast.success(t('success'))
      navigate(from, { replace: true })
    } catch (err) {
      const error = err as AxiosError<{ message: string }>
      if (error.response?.status === 422 || error.response?.status === 401) {
        setError('code', { message: t('twoFactor.errors.invalidCode') })
      } else {
        setError('root', { message: t('errors.serverError') })
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!partial_token) return null

  return (
    <div className="flex min-h-screen items-center justify-center login-bg p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('twoFactor.title')}</CardTitle>
          <CardDescription>
            {useBackup ? t('twoFactor.hintBackup') : t('twoFactor.hintTotp')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Countdown */}
          <p
            aria-live="polite"
            className={`text-center text-sm ${expired ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}
          >
            {expired
              ? t('twoFactor.expired')
              : t('twoFactor.expiresIn', { time: formatCountdown(secondsLeft) })}
          </p>

          {expired ? (
            <div className="space-y-3 text-center">
              <p className="text-sm text-muted-foreground">{t('twoFactor.expiredMessage')}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate(ROUTES.LOGIN)}>
                {t('twoFactor.backToLogin')}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.root && (
                <div
                  role="alert"
                  className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {errors.root.message}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="2fa-code">
                  {useBackup ? t('twoFactor.placeholderBackup') : t('twoFactor.placeholderTotp')}
                </Label>
                <Input
                  id="2fa-code"
                  type="text"
                  inputMode={useBackup ? 'text' : 'numeric'}
                  autoComplete="one-time-code"
                  placeholder={
                    useBackup ? t('twoFactor.placeholderBackup') : t('twoFactor.placeholderTotp')
                  }
                  aria-invalid={!!errors.code}
                  aria-describedby={errors.code ? '2fa-code-error' : undefined}
                  {...register('code')}
                />
                {errors.code && (
                  <p id="2fa-code-error" className="text-xs text-destructive">
                    {errors.code.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
                {t('twoFactor.submit')}
              </Button>
              <button
                type="button"
                onClick={() => {
                  setUseBackup((v) => !v)
                  reset({ code: '' })
                }}
                className="w-full text-center text-sm text-primary underline-offset-4 hover:underline"
              >
                {useBackup ? t('twoFactor.useTotp') : t('twoFactor.useBackupCode')}
              </button>
              <p className="text-center">
                <button
                  type="button"
                  onClick={() => navigate(ROUTES.LOGIN)}
                  className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                >
                  {t('twoFactor.backToLogin')}
                </button>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
