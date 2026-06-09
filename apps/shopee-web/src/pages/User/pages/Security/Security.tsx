import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useContext, useRef, useState, type FormEventHandler } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'
import { z } from 'zod'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import SEO from 'src/components/SEO'
import { AppContext } from 'src/contexts/app.context'
import totpApi, { TotpSetupResponse } from 'src/apis/totp.api'
import { isAxiosUnprocessableEntityError } from 'src/utils/utils'
import { ErrorResponseApi } from 'src/types/utils.type'

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const totpCodeSchema = z.object({
  code: z
    .string()
    .min(6, 'twoFactor.errors.codeRequired')
    .max(6, 'twoFactor.errors.codeTooLong')
    .regex(/^\d{6}$/, 'twoFactor.errors.codeDigitsOnly'),
})

const backupCodeSchema = z.object({
  code: z.string().min(1, 'twoFactor.errors.codeRequired'),
})

type CodeFormData = { code: string }

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function buildBackupCodesText(codes: string[]): string {
  return codes.join('\n')
}

function downloadBackupCodes(codes: string[], filename = 'shopee-backup-codes.txt') {
  const text = buildBackupCodesText(codes)
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface BackupCodesDisplayProps {
  codes: string[]
  copyLabel: string
  downloadLabel: string
  copiedLabel: string
}

function BackupCodesDisplay({
  codes,
  copyLabel,
  downloadLabel,
  copiedLabel,
}: BackupCodesDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyAll = () => {
    navigator.clipboard.writeText(buildBackupCodesText(codes)).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800/40 dark:bg-yellow-900/20">
      <ul className="mb-3 grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-sm text-gray-800 dark:text-gray-200">
        {codes.map((code) => (
          <li key={code} className="select-all tracking-wide">
            {code}
          </li>
        ))}
      </ul>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopyAll}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
        >
          {copied ? copiedLabel : copyLabel}
        </button>
        <button
          type="button"
          onClick={() => downloadBackupCodes(codes)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200 dark:hover:bg-slate-600"
        >
          {downloadLabel}
        </button>
      </div>
    </div>
  )
}

interface CodeInputFormProps {
  onSubmit: FormEventHandler<HTMLFormElement>
  isPending: boolean
  useBackupCode: boolean
  onToggleMode: () => void
  errors: { code?: { message?: string } }
  register: ReturnType<typeof useForm<CodeFormData>>['register']
  placeholder: string
  toggleLabel: string
  submitLabel: string
  cancelLabel?: string
  onCancel?: () => void
}

function CodeInputForm({
  onSubmit,
  isPending,
  useBackupCode,
  onToggleMode,
  errors,
  register,
  placeholder,
  toggleLabel,
  submitLabel,
  cancelLabel,
  onCancel,
}: CodeInputFormProps) {
  return (
    <form onSubmit={onSubmit} noValidate>
      <Input
        className="relative mb-3"
        classNameInput="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-slate-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        name="code"
        type="text"
        register={register}
        placeholder={placeholder}
        errorMessage={errors.code?.message}
        inputMode={useBackupCode ? 'text' : 'numeric'}
        maxLength={useBackupCode ? undefined : 6}
        autoComplete="one-time-code"
        disableFloatingLabel
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isPending}
          disabled={isPending}
          className="min-w-[120px] rounded-md px-4 py-2 text-sm"
        >
          {submitLabel}
        </Button>
        {cancelLabel && onCancel && (
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isPending}
            className="min-w-[80px] rounded-md px-4 py-2 text-sm"
          >
            {cancelLabel}
          </Button>
        )}
      </div>
      <button
        type="button"
        onClick={onToggleMode}
        className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
      >
        {toggleLabel}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

type View = 'status' | 'setup-step1' | 'setup-step2' | 'disable' | 'regenerate' | 'regen-done'

export default function Security() {
  const { t } = useTranslation('user')
  const { profile } = useContext(AppContext)
  const qc = useQueryClient()

  const twoFactorEnabled = profile?.twoFactorEnabled ?? false

  const [view, setView] = useState<View>('status')
  const [setupData, setSetupData] = useState<TotpSetupResponse | null>(null)
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([])
  const [useBackupCode, setUseBackupCode] = useState(false)

  // --- setup step1 form (just a trigger button, no code input yet)
  const setupMutation = useMutation({
    mutationFn: () => totpApi.setup(),
  })

  // --- setup step2 verify form
  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    setError: setErrorVerify,
    reset: resetVerify,
    formState: { errors: errorsVerify },
  } = useForm<CodeFormData>({
    resolver: zodResolver(totpCodeSchema),
    defaultValues: { code: '' },
  })

  const verifySetupMutation = useMutation({
    mutationFn: (body: CodeFormData) => totpApi.verifySetup(body),
  })

  // --- disable form
  const [disableUseBackup, setDisableUseBackup] = useState(false)
  const disableSchemaRef = useRef(disableUseBackup ? backupCodeSchema : totpCodeSchema)
  disableSchemaRef.current = disableUseBackup ? backupCodeSchema : totpCodeSchema
  const {
    register: registerDisable,
    handleSubmit: handleSubmitDisable,
    setError: setErrorDisable,
    reset: resetDisable,
    formState: { errors: errorsDisable },
  } = useForm<CodeFormData>({
    resolver: (...args) => zodResolver(disableSchemaRef.current)(...args),
    defaultValues: { code: '' },
  })

  const disableMutation = useMutation({
    mutationFn: (body: CodeFormData) => totpApi.disable(body),
  })

  // --- regenerate form
  const [regenUseBackup, setRegenUseBackup] = useState(false)
  const regenSchemaRef = useRef(regenUseBackup ? backupCodeSchema : totpCodeSchema)
  regenSchemaRef.current = regenUseBackup ? backupCodeSchema : totpCodeSchema
  const {
    register: registerRegen,
    handleSubmit: handleSubmitRegen,
    setError: setErrorRegen,
    reset: resetRegen,
    formState: { errors: errorsRegen },
  } = useForm<CodeFormData>({
    resolver: (...args) => zodResolver(regenSchemaRef.current)(...args),
    defaultValues: { code: '' },
  })

  const regenMutation = useMutation({
    mutationFn: (body: CodeFormData) => totpApi.backupCodes(body),
  })

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleStartSetup = () => {
    setupMutation.mutate(undefined, {
      onSuccess: (res) => {
        setSetupData(res.data.data)
        setView('setup-step1')
      },
      onError: () => {
        toast.error(t('security.errors.fetchFailed'), { autoClose: 3000 })
      },
    })
  }

  const onVerifySetupSubmit = handleSubmitVerify((data) => {
    verifySetupMutation.mutate(data, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['profile'] })
        toast.success(t('security.setup.success'), { autoClose: 3000 })
        setView('status')
        setSetupData(null)
        resetVerify({ code: '' })
      },
      onError: (error) => {
        if (isAxiosUnprocessableEntityError<ErrorResponseApi<{ code?: string }>>(error)) {
          const serverError = error.response?.data?.data
          if (serverError?.code) {
            setErrorVerify('code', { message: serverError.code, type: 'Server' })
          } else {
            setErrorVerify('code', {
              message: error.response?.data?.message ?? t('security.errors.invalidCode'),
              type: 'Server',
            })
          }
        } else {
          setErrorVerify('code', { message: t('security.errors.invalidCode'), type: 'Server' })
        }
      },
    })
  })

  const onDisableSubmit = handleSubmitDisable((data) => {
    disableMutation.mutate(data, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ['profile'] })
        toast.success(t('security.disable.success'), { autoClose: 3000 })
        setView('status')
        setDisableUseBackup(false)
        resetDisable({ code: '' })
      },
      onError: (error) => {
        if (isAxiosUnprocessableEntityError<ErrorResponseApi<{ code?: string }>>(error)) {
          const serverError = error.response?.data?.data
          if (serverError?.code) {
            setErrorDisable('code', { message: serverError.code, type: 'Server' })
          } else {
            setErrorDisable('code', {
              message: error.response?.data?.message ?? t('security.errors.invalidCode'),
              type: 'Server',
            })
          }
        } else {
          setErrorDisable('code', { message: t('security.errors.invalidCode'), type: 'Server' })
        }
      },
    })
  })

  const onRegenSubmit = handleSubmitRegen((data) => {
    regenMutation.mutate(data, {
      onSuccess: (res) => {
        qc.invalidateQueries({ queryKey: ['profile'] })
        setNewBackupCodes(res.data.data.backup_codes)
        toast.success(t('security.regenerate.success'), { autoClose: 3000 })
        setView('regen-done')
        setRegenUseBackup(false)
        resetRegen({ code: '' })
      },
      onError: (error) => {
        if (isAxiosUnprocessableEntityError<ErrorResponseApi<{ code?: string }>>(error)) {
          const serverError = error.response?.data?.data
          if (serverError?.code) {
            setErrorRegen('code', { message: serverError.code, type: 'Server' })
          } else {
            setErrorRegen('code', {
              message: error.response?.data?.message ?? t('security.errors.invalidCode'),
              type: 'Server',
            })
          }
        } else {
          setErrorRegen('code', { message: t('security.errors.invalidCode'), type: 'Server' })
        }
      },
    })
  })

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderStatus = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            twoFactorEnabled
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'
          }`}
        >
          {twoFactorEnabled ? t('security.badge.enabled') : t('security.badge.disabled')}
        </span>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {twoFactorEnabled ? t('security.status.enabled') : t('security.status.disabled')}
        </p>
      </div>

      {!twoFactorEnabled ? (
        <Button
          type="button"
          variant="primary"
          size="md"
          isLoading={setupMutation.isPending}
          disabled={setupMutation.isPending}
          onClick={handleStartSetup}
          className="rounded-md px-6 py-2.5 text-sm font-medium"
        >
          {t('security.enableBtn')}
        </Button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              setView('disable')
              setDisableUseBackup(false)
              resetDisable({ code: '' })
            }}
            className="rounded-md px-4 py-2 text-sm"
          >
            {t('security.disableBtn')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => {
              setView('regenerate')
              setRegenUseBackup(false)
              resetRegen({ code: '' })
            }}
            className="rounded-md px-4 py-2 text-sm"
          >
            {t('security.regenerateBtn')}
          </Button>
        </div>
      )}
    </div>
  )

  const renderSetupStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
        {t('security.setup.step1.title')}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('security.setup.step1.hint')}</p>

      {setupData && (
        <>
          {/* QR code */}
          <div className="flex justify-center">
            <img
              src={setupData.qr_code}
              alt="QR code for authenticator app"
              className="h-48 w-48 rounded-md border border-gray-200 dark:border-slate-600"
            />
          </div>

          {/* Manual secret */}
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('security.setup.step1.secretLabel')}
            </p>
            <code className="block select-all rounded-md bg-gray-100 px-3 py-2 font-mono text-sm text-gray-800 dark:bg-slate-700 dark:text-gray-200">
              {setupData.secret}
            </code>
          </div>

          {/* Backup codes */}
          <div>
            <p className="mb-1 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t('security.setup.step1.backupTitle')}
            </p>
            <p className="mb-2 text-xs text-yellow-700 dark:text-yellow-400">
              {t('security.setup.step1.backupWarning')}
            </p>
            <BackupCodesDisplay
              codes={setupData.backup_codes}
              copyLabel={t('security.setup.step1.copyAll')}
              downloadLabel={t('security.setup.step1.download')}
              copiedLabel={t('security.setup.step1.copied')}
            />
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => setView('setup-step2')}
            className="rounded-md px-6 py-2.5 text-sm font-medium"
          >
            {t('security.setup.step1.nextBtn')}
          </Button>
        </>
      )}
    </div>
  )

  const renderSetupStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
        {t('security.setup.step2.title')}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('security.setup.step2.hint')}</p>
      <form onSubmit={onVerifySetupSubmit} noValidate className="space-y-3">
        <Input
          className="relative"
          classNameInput="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-slate-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          name="code"
          type="text"
          register={registerVerify}
          placeholder={t('security.setup.step2.placeholder')}
          errorMessage={errorsVerify.code?.message}
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          disableFloatingLabel
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={verifySetupMutation.isPending}
            disabled={verifySetupMutation.isPending}
            className="rounded-md px-5 py-2 text-sm"
          >
            {t('security.setup.step2.submitBtn')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setView('setup-step1')}
            disabled={verifySetupMutation.isPending}
            className="rounded-md px-4 py-2 text-sm"
          >
            {t('security.setup.step2.backBtn')}
          </Button>
        </div>
      </form>
    </div>
  )

  const renderDisable = () => (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
        {t('security.disable.title')}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('security.disable.hint')}</p>
      <CodeInputForm
        onSubmit={onDisableSubmit}
        isPending={disableMutation.isPending}
        useBackupCode={disableUseBackup}
        onToggleMode={() => {
          setDisableUseBackup((p) => !p)
          resetDisable({ code: '' })
        }}
        errors={errorsDisable}
        register={registerDisable}
        placeholder={t('security.disable.placeholder')}
        toggleLabel={
          disableUseBackup ? t('security.disable.useTotp') : t('security.disable.useBackup')
        }
        submitLabel={t('security.disable.submitBtn')}
        cancelLabel={t('security.disable.cancelBtn')}
        onCancel={() => {
          setView('status')
          setDisableUseBackup(false)
          resetDisable({ code: '' })
        }}
      />
    </div>
  )

  const renderRegenerate = () => (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
        {t('security.regenerate.title')}
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('security.regenerate.hint')}</p>
      <CodeInputForm
        onSubmit={onRegenSubmit}
        isPending={regenMutation.isPending}
        useBackupCode={regenUseBackup}
        onToggleMode={() => {
          setRegenUseBackup((p) => !p)
          resetRegen({ code: '' })
        }}
        errors={errorsRegen}
        register={registerRegen}
        placeholder={t('security.regenerate.placeholder')}
        toggleLabel={
          regenUseBackup ? t('security.regenerate.useTotp') : t('security.regenerate.useBackup')
        }
        submitLabel={t('security.regenerate.submitBtn')}
        cancelLabel={t('security.regenerate.cancelBtn')}
        onCancel={() => {
          setView('status')
          setRegenUseBackup(false)
          resetRegen({ code: '' })
        }}
      />
    </div>
  )

  const renderRegenDone = () => (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">
        {t('security.regenerate.newCodesTitle')}
      </h2>
      <p className="text-xs text-yellow-700 dark:text-yellow-400">
        {t('security.regenerate.newCodesWarning')}
      </p>
      <BackupCodesDisplay
        codes={newBackupCodes}
        copyLabel={t('security.regenerate.copyAll')}
        downloadLabel={t('security.regenerate.download')}
        copiedLabel={t('security.regenerate.copied')}
      />
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={() => {
          setView('status')
          setNewBackupCodes([])
        }}
        className="rounded-md px-4 py-2 text-sm"
      >
        {t('security.disable.cancelBtn')}
      </Button>
    </div>
  )

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="rounded-md bg-white px-2 pb-10 shadow-sm md:px-7 md:pb-20 dark:bg-slate-800">
      <SEO title={t('security.meta.title')} noindex />

      {/* Header */}
      <div className="border-b border-b-gray-100 py-6 text-center sm:text-left dark:border-b-slate-600">
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
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-medium capitalize text-gray-700 dark:text-gray-200">
              {t('security.title')}
            </h1>
            <div className="mt-0.75 text-[.875rem] text-gray-500 dark:text-gray-400">
              {t('security.description')}
            </div>
          </div>
        </div>
        <div className="mt-4 h-0.5 bg-linear-to-r from-orange/60 via-orange/20 to-transparent dark:from-orange-400/50 dark:via-orange-400/10 dark:to-transparent" />
      </div>

      {/* Body */}
      <div className="mt-8 max-w-lg">
        {view === 'status' && renderStatus()}
        {view === 'setup-step1' && renderSetupStep1()}
        {view === 'setup-step2' && renderSetupStep2()}
        {view === 'disable' && renderDisable()}
        {view === 'regenerate' && renderRegenerate()}
        {view === 'regen-done' && renderRegenDone()}
      </div>
    </div>
  )
}
