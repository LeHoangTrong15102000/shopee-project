import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Tabs, TabsList, TabsTrigger, TabsContent } from 'src/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'src/components/ui/card'
import { Input } from 'src/components/ui/input'
import { Label } from 'src/components/ui/label'
import { Button } from 'src/components/ui/button'
import { Switch } from 'src/components/ui/switch'
import { PageHeader } from 'src/components/shared/PageHeader'
import { LoadingState } from 'src/components/shared/LoadingState'
import { ErrorState } from 'src/components/shared/ErrorState'
import { useAuthStore } from 'src/stores/auth.store'
import { useNotificationStore } from 'src/stores/notification.store'
import settingsApi from 'src/apis/settings.api'
import totpApi from 'src/apis/totp.api'
import type { TotpSetupResponse, BackupCodesResponse } from 'src/apis/totp.api'
import { AxiosError } from 'axios'

// --- Profile Tab ---

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  date_of_birth: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

// --- Password Tab ---

const passwordSchema = z
  .object({
    password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(6, 'New password must be at least 6 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })
type PasswordForm = z.infer<typeof passwordSchema>

// --- Security Tab helpers ---

type SecurityView =
  | 'status'
  | 'setup-step1'
  | 'setup-step2'
  | 'disable'
  | 'regenerate'
  | 'regen-done'

const codeSchema = z.object({
  code: z.string().min(6, 'Code must be at least 6 characters').max(32, 'Code is too long'),
})
const backupCodeSchema = z.object({
  code: z.string().min(1, 'Code is required'),
})
type CodeForm = z.infer<typeof codeSchema>

function downloadBackupCodes(codes: string[], filename = 'backup-codes.txt') {
  const content = codes.join('\n')
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

interface BackupCodesDisplayProps {
  codes: string[]
  warningKey: string
  titleKey: string
}

function BackupCodesDisplay({ codes, warningKey, titleKey }: BackupCodesDisplayProps) {
  const { t } = useTranslation('settings')
  const [copied, setCopied] = useState(false)

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(codes.join('\n'))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{t(titleKey)}</p>
      <p className="text-sm text-destructive font-semibold">{t(warningKey)}</p>
      <div className="rounded-md border bg-muted/50 p-3 font-mono text-sm grid grid-cols-2 gap-1">
        {codes.map((code) => (
          <span key={code}>{code}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleCopyAll}>
          {copied ? t('security.setup.copyAllDone') : t('security.setup.copyAll')}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => downloadBackupCodes(codes)}
        >
          {t('security.setup.download')}
        </Button>
      </div>
    </div>
  )
}

interface CodeInputFormProps {
  onSubmit: (data: CodeForm) => void
  isPending: boolean
  useBackup: boolean
  onToggleBackup: () => void
  submitLabel: string
  pendingLabel: string
  fieldError?: string
  rootError?: string
}

function CodeInputForm({
  onSubmit,
  isPending,
  useBackup,
  onToggleBackup,
  submitLabel,
  pendingLabel,
  fieldError,
  rootError,
}: CodeInputFormProps) {
  const { t } = useTranslation('settings')
  const schemaRef = useRef(useBackup ? backupCodeSchema : codeSchema)
  schemaRef.current = useBackup ? backupCodeSchema : codeSchema
  const { register, handleSubmit } = useForm<CodeForm>({
    resolver: (...args) => zodResolver(schemaRef.current)(...args),
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-sm">
      {rootError && (
        <div role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {rootError}
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="security-code">
          {useBackup
            ? t('security.form.codePlaceholderBackup')
            : t('security.form.codePlaceholderTotp')}
        </Label>
        <Input
          id="security-code"
          type="text"
          inputMode={useBackup ? 'text' : 'numeric'}
          placeholder={
            useBackup
              ? t('security.form.codePlaceholderBackup')
              : t('security.form.codePlaceholderTotp')
          }
          aria-invalid={!!fieldError}
          {...register('code')}
        />
        {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending ? pendingLabel : submitLabel}
      </Button>
      <button
        type="button"
        onClick={onToggleBackup}
        className="block text-sm text-primary underline-offset-4 hover:underline"
      >
        {useBackup ? t('security.form.useTotp') : t('security.form.useBackupCode')}
      </button>
    </form>
  )
}

export const NOTIFICATION_SOUND_KEY = 'admin_notification_sound'

export function getNotificationSoundEnabled(): boolean {
  try {
    const stored = localStorage.getItem(NOTIFICATION_SOUND_KEY)
    return stored !== 'false'
  } catch {
    return true
  }
}

// --- Component ---

export default function SettingsPage() {
  const { t } = useTranslation('settings')
  const [activeTab, setActiveTab] = useState<string>('profile')
  const [soundEnabled, setSoundEnabled] = useState<boolean>(getNotificationSoundEnabled)
  const { user, setUser } = useAuthStore()
  const qc = useQueryClient()

  // Security tab state
  const [secView, setSecView] = useState<SecurityView>('status')
  const [secUseBackup, setSecUseBackup] = useState(false)
  const [setupData, setSetupData] = useState<TotpSetupResponse | null>(null)
  const [regenCodes, setRegenCodes] = useState<string[] | null>(null)
  const [secCodeError, setSecCodeError] = useState<string | undefined>(undefined)
  const [secRootError, setSecRootError] = useState<string | undefined>(undefined)

  const handleSoundToggle = (checked: boolean) => {
    setSoundEnabled(checked)
    try {
      localStorage.setItem(NOTIFICATION_SOUND_KEY, String(checked))
    } catch {
      // ignore
    }
  }

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: () => settingsApi.getProfile().then((r) => r.data.data),
  })
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name ?? '',
      phone: profile?.phone ?? '',
      address: profile?.address ?? '',
      avatar: profile?.avatar ?? '',
      date_of_birth: profile?.date_of_birth ? profile.date_of_birth.slice(0, 10) : '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '', new_password: '', confirm_password: '' },
  })

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) =>
      settingsApi.updateProfile({
        name: data.name,
        phone: data.phone || undefined,
        address: data.address || undefined,
        avatar: data.avatar || undefined,
        date_of_birth: data.date_of_birth || undefined,
      }),
    onSuccess: (res) => {
      toast.success(t('toast.profileUpdated'))
      setUser(res.data.data)
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => toast.error(t('toast.profileError')),
  })

  const changePassword = useMutation({
    mutationFn: (data: PasswordForm) =>
      settingsApi.updateProfile({ password: data.password, new_password: data.new_password }),
    onSuccess: () => {
      toast.success(t('toast.passwordChanged'))
      passwordForm.reset()
    },
    onError: () => toast.error(t('toast.passwordError')),
  })

  // Security mutations
  const setupMutation = useMutation({
    mutationFn: () => totpApi.setup(),
    onSuccess: (res) => {
      setSetupData(res.data.data)
      setSecView('setup-step1')
      setSecCodeError(undefined)
      setSecRootError(undefined)
    },
    onError: () => setSecRootError(t('security.errors.setupFailed')),
  })

  const verifySetupMutation = useMutation({
    mutationFn: (data: CodeForm) => totpApi.verifySetup({ code: data.code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast.success(t('security.setup.successMessage'))
      setSecView('status')
      setSetupData(null)
      setSecCodeError(undefined)
    },
    onError: (err) => {
      const error = err as AxiosError<{ message: string }>
      if (error.response?.status === 422 || error.response?.status === 401) {
        setSecCodeError(t('security.errors.invalidCode'))
      } else {
        setSecRootError(t('security.errors.setupFailed'))
      }
    },
  })

  const disableMutation = useMutation({
    mutationFn: (data: CodeForm) => totpApi.disable({ code: data.code }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] })
      toast.success(t('security.disable.successMessage'))
      setSecView('status')
      setSecCodeError(undefined)
      setSecRootError(undefined)
    },
    onError: (err) => {
      const error = err as AxiosError<{ message: string }>
      if (error.response?.status === 422 || error.response?.status === 401) {
        setSecCodeError(t('security.errors.invalidCode'))
      } else {
        setSecRootError(t('security.errors.disableFailed'))
      }
    },
  })

  const regenMutation = useMutation({
    mutationFn: (data: CodeForm) => totpApi.backupCodes({ code: data.code }),
    onSuccess: (res) => {
      const newCodes: BackupCodesResponse = res.data.data
      setRegenCodes(newCodes.backup_codes)
      setSecView('regen-done')
      setSecCodeError(undefined)
      setSecRootError(undefined)
    },
    onError: (err) => {
      const error = err as AxiosError<{ message: string }>
      if (error.response?.status === 422 || error.response?.status === 401) {
        setSecCodeError(t('security.errors.invalidCode'))
      } else {
        setSecRootError(t('security.errors.regenFailed'))
      }
    },
  })

  if (isLoading) return <LoadingState />
  if (isError) return <ErrorState message={t('error')} onRetry={refetch} />
  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          <TabsTrigger value="password">{t('tabs.changePassword')}</TabsTrigger>
          <TabsTrigger value="notifications">{t('tabs.notifications')}</TabsTrigger>
          <TabsTrigger value="system">{t('tabs.systemInfo')}</TabsTrigger>
          <TabsTrigger value="security">{t('tabs.security')}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.title')}</CardTitle>
              <CardDescription>{t('profile.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={profileForm.handleSubmit((d) => updateProfile.mutate(d))}
                className="space-y-4 max-w-lg"
              >
                <div>
                  <Label htmlFor="settings-name">{t('profile.name')}</Label>
                  <Input id="settings-name" {...profileForm.register('name')} />
                  {profileForm.formState.errors.name && (
                    <p className="text-sm text-destructive mt-1">
                      {profileForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="settings-email">{t('profile.email')}</Label>
                  <Input id="settings-email" value={profile?.email ?? ''} disabled />
                </div>
                <div>
                  <Label htmlFor="settings-phone">{t('profile.phone')}</Label>
                  <Input id="settings-phone" {...profileForm.register('phone')} />
                </div>
                <div>
                  <Label htmlFor="settings-address">{t('profile.address')}</Label>
                  <Input id="settings-address" {...profileForm.register('address')} />
                </div>
                <div>
                  <Label htmlFor="settings-avatar">{t('profile.avatarUrl')}</Label>
                  <Input
                    id="settings-avatar"
                    {...profileForm.register('avatar')}
                    placeholder="https://..."
                  />
                  {profileForm.formState.errors.avatar && (
                    <p className="text-sm text-destructive mt-1">
                      {profileForm.formState.errors.avatar.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="settings-dob">{t('profile.dateOfBirth')}</Label>
                  <Input id="settings-dob" type="date" {...profileForm.register('date_of_birth')} />
                </div>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? t('profile.saving') : t('profile.save')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>{t('password.title')}</CardTitle>
              <CardDescription>{t('password.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))}
                className="space-y-4 max-w-lg"
              >
                <div>
                  <Label htmlFor="settings-current-pw">{t('password.currentPassword')}</Label>
                  <Input
                    id="settings-current-pw"
                    type="password"
                    {...passwordForm.register('password')}
                  />
                  {passwordForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1">
                      {passwordForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="settings-new-pw">{t('password.newPassword')}</Label>
                  <Input
                    id="settings-new-pw"
                    type="password"
                    {...passwordForm.register('new_password')}
                  />
                  {passwordForm.formState.errors.new_password && (
                    <p className="text-sm text-destructive mt-1">
                      {passwordForm.formState.errors.new_password.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="settings-confirm-pw">{t('password.confirmPassword')}</Label>
                  <Input
                    id="settings-confirm-pw"
                    type="password"
                    {...passwordForm.register('confirm_password')}
                  />
                  {passwordForm.formState.errors.confirm_password && (
                    <p className="text-sm text-destructive mt-1">
                      {passwordForm.formState.errors.confirm_password.message}
                    </p>
                  )}
                </div>
                <Button type="submit" disabled={changePassword.isPending}>
                  {changePassword.isPending ? t('password.changing') : t('password.change')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>{t('notifications.title')}</CardTitle>
              <CardDescription>{t('notifications.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg border p-4 max-w-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="sound-toggle" className="text-sm font-medium">
                    {t('notifications.soundToggle')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('notifications.soundDescription')}
                  </p>
                </div>
                <Switch
                  id="sound-toggle"
                  checked={soundEnabled}
                  onCheckedChange={handleSoundToggle}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          {' '}
          <Card>
            <CardHeader>
              <CardTitle>{t('system.title')}</CardTitle>
              <CardDescription>{t('system.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>{t('system.appVersion')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{import.meta.env.VITE_APP_VERSION}</p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>{t('system.apiBaseUrl')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-mono break-all">
                      {import.meta.env.VITE_API_BASE_URL ?? 'https://api-ecom.lehoangtrong.com/'}
                    </p>
                  </CardContent>
                </Card>
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>{t('system.environment')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold capitalize">{import.meta.env.MODE}</p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>{t('security.title')}</CardTitle>
              <CardDescription>{t('security.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status view */}
              {secView === 'status' && (
                <div className="space-y-4">
                  <p className="text-sm font-medium">
                    {profile?.twoFactorEnabled
                      ? t('security.statusEnabled')
                      : t('security.statusDisabled')}
                  </p>
                  {secRootError && <p className="text-sm text-destructive">{secRootError}</p>}
                  {!profile?.twoFactorEnabled ? (
                    <Button
                      onClick={() => {
                        setSecRootError(undefined)
                        setupMutation.mutate()
                      }}
                      disabled={setupMutation.isPending}
                    >
                      {setupMutation.isPending ? '...' : t('security.enableButton')}
                    </Button>
                  ) : (
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          setSecCodeError(undefined)
                          setSecRootError(undefined)
                          setSecUseBackup(false)
                          setSecView('disable')
                        }}
                      >
                        {t('security.disableButton')}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSecCodeError(undefined)
                          setSecRootError(undefined)
                          setSecUseBackup(false)
                          setSecView('regenerate')
                        }}
                      >
                        {t('security.regenerateButton')}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Setup step 1 — QR + secret + backup codes */}
              {secView === 'setup-step1' && setupData && (
                <div className="space-y-4 max-w-lg">
                  <p className="text-sm font-semibold">{t('security.setup.step1Title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('security.setup.step1Description')}
                  </p>
                  <img
                    src={setupData.qr_code}
                    alt="2FA QR code"
                    className="w-48 h-48 rounded border"
                  />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t('security.setup.secretLabel')}
                    </p>
                    <code className="block rounded bg-muted px-2 py-1 text-sm break-all">
                      {setupData.secret}
                    </code>
                  </div>
                  <BackupCodesDisplay
                    codes={setupData.backup_codes}
                    titleKey="security.setup.backupCodesTitle"
                    warningKey="security.setup.backupCodesWarning"
                  />
                  <Button onClick={() => setSecView('setup-step2')}>
                    {t('security.setup.continueToVerify')}
                  </Button>
                </div>
              )}

              {/* Setup step 2 — verify code */}
              {secView === 'setup-step2' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold">{t('security.setup.step2Title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('security.setup.step2Description')}
                  </p>
                  <CodeInputForm
                    onSubmit={(data) => {
                      setSecCodeError(undefined)
                      verifySetupMutation.mutate(data)
                    }}
                    isPending={verifySetupMutation.isPending}
                    useBackup={secUseBackup}
                    onToggleBackup={() => setSecUseBackup((v) => !v)}
                    submitLabel={t('security.setup.verifyButton')}
                    pendingLabel={t('security.setup.verifying')}
                    fieldError={secCodeError}
                    rootError={secRootError}
                  />
                </div>
              )}

              {/* Disable view */}
              {secView === 'disable' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold">{t('security.disable.title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('security.disable.description')}
                  </p>
                  <CodeInputForm
                    onSubmit={(data) => {
                      setSecCodeError(undefined)
                      disableMutation.mutate(data)
                    }}
                    isPending={disableMutation.isPending}
                    useBackup={secUseBackup}
                    onToggleBackup={() => setSecUseBackup((v) => !v)}
                    submitLabel={t('security.disable.submitButton')}
                    pendingLabel={t('security.disable.submitting')}
                    fieldError={secCodeError}
                    rootError={secRootError}
                  />
                  <button
                    type="button"
                    onClick={() => setSecView('status')}
                    className="text-sm text-muted-foreground underline-offset-4 hover:underline"
                  >
                    {t('security.disable.cancel', 'Cancel')}
                  </button>
                </div>
              )}

              {/* Regenerate view */}
              {secView === 'regenerate' && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold">{t('security.regenerate.title')}</p>
                  <p className="text-sm text-muted-foreground">
                    {t('security.regenerate.description')}
                  </p>
                  <CodeInputForm
                    onSubmit={(data) => {
                      setSecCodeError(undefined)
                      regenMutation.mutate(data)
                    }}
                    isPending={regenMutation.isPending}
                    useBackup={secUseBackup}
                    onToggleBackup={() => setSecUseBackup((v) => !v)}
                    submitLabel={t('security.regenerate.submitButton')}
                    pendingLabel={t('security.regenerate.submitting')}
                    fieldError={secCodeError}
                    rootError={secRootError}
                  />
                </div>
              )}

              {/* Regen done — show new codes */}
              {secView === 'regen-done' && regenCodes && (
                <div className="space-y-4 max-w-lg">
                  <BackupCodesDisplay
                    codes={regenCodes}
                    titleKey="security.regenerate.newCodesTitle"
                    warningKey="security.regenerate.newCodesWarning"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRegenCodes(null)
                      setSecView('status')
                    }}
                  >
                    {t('security.regenerate.done', 'Done')}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
