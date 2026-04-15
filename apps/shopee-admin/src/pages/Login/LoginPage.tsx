import { useState } from 'react'
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
import authApi from 'src/apis/auth.api'
import { clearLS } from 'src/utils/http'
import { AxiosError } from 'axios'
import type { User } from 'src/types'

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

const DEV_ADMIN: User = {
  _id: 'dev-admin-001',
  email: 'admin@shopee.com',
  name: 'Dev Admin',
  roles: ['Admin'],
  avatar: '',
  phone: '',
  address: '',
  date_of_birth: '1990-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

export default function LoginPage() {
  const { t } = useTranslation('login')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore((s) => s.login)

  const from = (location.state as { from?: string })?.from || '/'

  const handleDevLogin = () => {
    login('dev-access-token', 'dev-refresh-token', DEV_ADMIN)
    toast.success(t('dev.loginSuccess'))
    navigate(from, { replace: true })
  }

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const res = await authApi.login(data)
      const { access_token, refresh_token, user } = res.data.data

      if (!user.roles?.includes('Admin')) {
        clearLS()
        toast.error(t('errors.accessDenied'))
        return
      }

      login(access_token, refresh_token, user)
      toast.success(t('success'))
      navigate(from, { replace: true })
    } catch (err) {
      const error = err as AxiosError<{ message: string }>
      if (error.response?.status === 401) {
        setError('root', { message: t('errors.invalidCredentials') })
      } else {
        setError('root', { message: t('errors.serverError') })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
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
              <Label htmlFor="email">{t('form.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('form.emailPlaceholder')}
                {...register('email')}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('form.password')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('form.passwordPlaceholder')}
                {...register('password')}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {t('form.signIn')}
            </Button>
            {import.meta.env.DEV && (
              <div className="space-y-2">
                <p className="text-center text-xs text-muted-foreground">
                  {t('dev.credentialHint')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed border-yellow-500 text-yellow-500 hover:bg-yellow-500/10 hover:text-yellow-400"
                  onClick={handleDevLogin}
                >
                  {t('dev.loginButton')}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
