import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import SEO from 'src/components/SEO'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { toast } from 'react-toastify'
import passwordResetApi from 'src/apis/password-reset.api'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import path from 'src/constant/path'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import i18n from 'src/i18n/i18n'
import { STAGGER_DELAY, staggerContainer, staggerItem } from 'src/styles/animations'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email(i18n.t('validation:forgotPassword.emailInvalid'))
})

type FormData = z.infer<typeof forgotPasswordSchema>

const ForgotPassword = () => {
  const { t } = useTranslation('auth')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const reducedMotion = useReducedMotion()
  const containerVariants = staggerContainer(STAGGER_DELAY.normal)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormData>({
    mode: 'onTouched',
    resolver: zodResolver(forgotPasswordSchema)
  })

  const watchEmail = watch('email', '')

  const forgotPasswordMutation = useMutation({
    mutationFn: (body: FormData) => passwordResetApi.forgotPassword(body.email)
  })

  const onSubmit = handleSubmit((data) => {
    forgotPasswordMutation.mutate(data, {
      onSuccess: () => {
        setIsSubmitted(true)
        toast.success(t('forgotPassword.toast.success'), { autoClose: 3000 })
      },
      onError: () => {
        toast.error(t('forgotPassword.toast.error'), { autoClose: 2000 })
      }
    })
  })

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
      <SEO title={t('forgotPassword.meta.title')} description={t('forgotPassword.meta.description')} />
      <div className='relative container min-h-[60vh] lg:min-h-[773.94px]'>
        <div className='grid grid-cols-1 py-8 md:grid-cols-3 md:py-16 lg:grid-cols-5 lg:py-32 lg:pr-10'>
          <div className='mt-10 md:col-span-3 md:mx-auto md:w-full md:max-w-md lg:col-span-2 lg:col-start-4 lg:mx-0 lg:max-w-none'>
            <motion.div
              className='rounded-sm bg-white p-10 shadow-xs dark:bg-slate-800 dark:shadow-slate-900/50'
              variants={reducedMotion ? undefined : containerVariants}
              initial={reducedMotion ? undefined : 'hidden'}
              animate={reducedMotion ? undefined : 'visible'}
            >
              {!isSubmitted ? (
                <form onSubmit={onSubmit} noValidate>
                  <motion.div variants={reducedMotion ? undefined : staggerItem}>
                    <div className='text-2xl text-gray-900 dark:text-gray-100'>{t('forgotPassword.title')}</div>
                    <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>{t('forgotPassword.subtitle')}</p>
                  </motion.div>

                  <motion.div variants={reducedMotion ? undefined : staggerItem}>
                    <Input
                      className='relative mt-6'
                      classNameInput='w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 shadow-xs dark:shadow-slate-900/30 outline-hidden focus:border-gray-500 dark:focus:border-slate-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
                      type='email'
                      name='email'
                      value={watchEmail}
                      autoComplete='on'
                      register={register}
                      placeholder='Email'
                      errorMessage={errors.email?.message}
                    />
                  </motion.div>

                  <motion.div variants={reducedMotion ? undefined : staggerItem}>
                    <div className='mt-4'>
                      <Button
                        isLoading={forgotPasswordMutation.isPending}
                        disabled={forgotPasswordMutation.isPending}
                        type='submit'
                        className='flex w-full items-center justify-center bg-red-500 px-2 py-4 text-center text-sm text-white uppercase hover:bg-red-600'
                      >
                        {t('forgotPassword.submit')}
                      </Button>
                    </div>
                  </motion.div>

                  <motion.div variants={reducedMotion ? undefined : staggerItem}>
                    <div className='mt-6 text-center'>
                      <Link to={path.login} className='text-sm text-orange dark:text-orange-400'>
                        {t('forgotPassword.backToLogin')}
                      </Link>
                    </div>
                  </motion.div>
                </form>
              ) : (
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
                    {t('forgotPassword.success.title')}
                  </h3>
                  <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>{t('forgotPassword.success.message')}</p>
                  <div className='mt-6'>
                    <Link to={path.login} className='text-sm text-orange dark:text-orange-400'>
                      {t('forgotPassword.backToLogin')}
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
