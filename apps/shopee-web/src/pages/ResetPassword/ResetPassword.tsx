import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import SEO from 'src/components/SEO'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'react-toastify'
import passwordResetApi from 'src/apis/password-reset.api'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import path from 'src/constant/path'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import i18n from 'src/i18n/i18n'
import { STAGGER_DELAY, staggerContainer, staggerItem } from 'src/styles/animations'
import { z } from 'zod'

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, i18n.t('validation:resetPassword.minLength')),
    confirmPassword: z.string().min(1, i18n.t('validation:resetPassword.confirmRequired'))
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: i18n.t('validation:resetPassword.mismatch'),
    path: ['confirmPassword']
  })

type FormData = z.infer<typeof resetPasswordSchema>

const ResetPassword = () => {
  const { t } = useTranslation('auth')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')
  const [isSuccess, setIsSuccess] = useState(false)
  const reducedMotion = useReducedMotion()
  const containerVariants = staggerContainer(STAGGER_DELAY.normal)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    mode: 'onTouched',
    resolver: zodResolver(resetPasswordSchema)
  })

  const watchPassword = watch('password', '')
  const watchConfirmPassword = watch('confirmPassword', '')

  const resetPasswordMutation = useMutation({
    mutationFn: (body: FormData) => passwordResetApi.resetPassword(token!, body.password, body.confirmPassword)
  })

  const onSubmit = handleSubmit((data) => {
    if (!token) return
    resetPasswordMutation.mutate(data, {
      onSuccess: () => {
        setIsSuccess(true)
        toast.success(t('resetPassword.toast.success'), { autoClose: 3000 })
      },
      onError: () => {
        toast.error(t('resetPassword.toast.error'), { autoClose: 2000 })
      }
    })
  })

  // Redirect to login after 3 seconds on success
  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => {
        navigate(path.login)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, navigate])

  return (
    <div className='relative bg-orange'>
      <div
        className='absolute inset-0 hidden lg:block'
        style={{
          backgroundImage: 'url(https://cf.shopee.vn/file/sg-11134004-23020-75qwyq2a7snv15)',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center center'
        }}
      />
      <SEO title={t('resetPassword.meta.title')} description={t('resetPassword.meta.description')} />
      <div className='relative container min-h-[60vh] lg:min-h-[773.94px]'>
        <div className='grid grid-cols-1 py-8 md:grid-cols-3 md:py-16 lg:grid-cols-5 lg:py-32 lg:pr-10'>
          <div className='mt-10 md:col-span-3 md:mx-auto md:w-full md:max-w-md lg:col-span-2 lg:col-start-4 lg:mx-0 lg:max-w-none'>
            <motion.div
              className='rounded-sm bg-white p-10 shadow-xs dark:bg-slate-800 dark:shadow-slate-900/50'
              variants={reducedMotion ? undefined : containerVariants}
              initial={reducedMotion ? undefined : 'hidden'}
              animate={reducedMotion ? undefined : 'visible'}
            >
              {!token ? (
                <div className='text-center'>
                  <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
                    <svg className='h-8 w-8 text-red-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </div>
                  <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                    {t('resetPassword.invalidLink.title')}
                  </h3>
                  <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                    {t('resetPassword.invalidLink.message')}
                  </p>
                  <div className='mt-6'>
                    <Link to={path.forgotPassword} className='text-sm text-orange dark:text-orange-400'>
                      {t('resetPassword.invalidLink.requestNew')}
                    </Link>
                  </div>
                </div>
              ) : isSuccess ? (
                <motion.div
                  initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
                  animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
                  className='text-center'
                >
                  <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'>
                    <svg className='h-8 w-8 text-green-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                    </svg>
                  </div>
                  <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100'>
                    {t('resetPassword.success.title')}
                  </h3>
                  <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>{t('resetPassword.success.message')}</p>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} noValidate>
                  <motion.div variants={reducedMotion ? undefined : staggerItem}>
                    <div className='text-2xl text-gray-900 dark:text-gray-100'>{t('resetPassword.title')}</div>
                  </motion.div>

                  <motion.div variants={reducedMotion ? undefined : staggerItem}>
                    <Input
                      className='relative mt-6'
                      classNameInput='w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 shadow-xs dark:shadow-slate-900/30 outline-hidden focus:border-gray-500 dark:focus:border-slate-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                      type='password'
                      name='password'
                      value={watchPassword}
                      autoComplete='new-password'
                      register={register}
                      placeholder={t('resetPassword.newPassword')}
                      errorMessage={errors.password?.message}
                    />
                  </motion.div>

                  <motion.div variants={reducedMotion ? undefined : staggerItem}>
                    <Input
                      className='relative mt-2'
                      classNameInput='w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 shadow-xs dark:shadow-slate-900/30 outline-hidden focus:border-gray-500 dark:focus:border-slate-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                      type='password'
                      name='confirmPassword'
                      value={watchConfirmPassword}
                      autoComplete='new-password'
                      register={register}
                      placeholder={t('resetPassword.confirmPassword')}
                      errorMessage={errors.confirmPassword?.message}
                    />
                  </motion.div>

                  <motion.div variants={reducedMotion ? undefined : staggerItem}>
                    <div className='mt-4'>
                      <Button
                        isLoading={resetPasswordMutation.isPending}
                        disabled={resetPasswordMutation.isPending}
                        type='submit'
                        className='flex w-full items-center justify-center bg-red-500 px-2 py-4 text-center text-sm text-white uppercase hover:bg-red-600'
                      >
                        {t('resetPassword.submit')}
                      </Button>
                    </div>
                  </motion.div>

                  <motion.div variants={reducedMotion ? undefined : staggerItem}>
                    <div className='mt-6 text-center'>
                      <Link to={path.login} className='text-sm text-orange dark:text-orange-400'>
                        {t('resetPassword.backToLogin')}
                      </Link>
                    </div>
                  </motion.div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
