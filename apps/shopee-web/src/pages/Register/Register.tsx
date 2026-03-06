import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import classNames from 'classnames'
import { motion } from 'framer-motion'
import omit from 'lodash/omit'
import { useContext } from 'react'
import SEO from 'src/components/SEO'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { toast } from 'react-toastify'
import authApi from 'src/apis/auth.api'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import PasswordStrengthMeter from 'src/components/PasswordStrengthMeter'
import path from 'src/constant/path'
import { AppContext } from 'src/contexts/app.context'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { STAGGER_DELAY, staggerContainer, staggerItem } from 'src/styles/animations'
import { ErrorResponseApi } from 'src/types/utils.type'
import { RegisterSchema, registerSchema } from 'src/utils/rules'
import { isAxiosUnprocessableEntityError } from 'src/utils/utils'

type FormData = RegisterSchema
// co ra sau thì ra chứ t vẫn đứng ở đây mà thôi có gì mà đâu mà phải sợ

const Register = () => {
  const { t } = useTranslation('auth')
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const navigate = useNavigate()
  const {
    register, // Dùng register để cung cấp thông tin cho react-hook-form, {...register('truyền cho nó 1 cái name chính là key của chúng ta')}
    handleSubmit,
    watch,
    setError,
    formState: { errors }
  } = useForm<FormData>({
    mode: 'onTouched',
    resolver: zodResolver(registerSchema)
  }) // return cho chúng ta một cái object, truyền genericType chung cho useForm
  // Tạo một cái rules handle việc validate form

  const watchEmail = watch('email', '')
  const watchPassword = watch('password', '')
  const watchConfirmPassword = watch('confirm_password', '')

  const reducedMotion = useReducedMotion()
  const containerVariants = staggerContainer(STAGGER_DELAY.normal)

  const registerAccountMutation = useMutation({
    mutationFn: (body: Omit<FormData, 'confirm_password'>) => authApi.registerAccount(body),
    onSuccess: (_) => {
      toast.success(t('register.success'), { autoClose: 1000 })
    },
    onError: () => {
      toast.error(t('register.error'), { autoClose: 1000 })
    }
  })

  // func handleSubmit nó sẽ không chạy khi mà cái formState chúng ta không đúng
  const onSubmit = handleSubmit((data) => {
    // confirm_password chỉ thực hiện validate ở FE mà thôi còn lên trên server thì không cần
    const body = omit(data, ['confirm_password'])
    registerAccountMutation.mutate(body as Omit<FormData, 'confirm_password'>, {
      onSuccess: (data) => {
        // console.log(data)
        setIsAuthenticated(true)
        setProfile(data.data.data.user)
        navigate('/')
      },
      onError: (error) => {
        // console.log('error', error)
        if (isAxiosUnprocessableEntityError<ErrorResponseApi<Omit<FormData, 'confirm_password'>>>(error)) {
          // Lấy lỗi và set vào RHF setError
          const formError = error.response?.data.data
          if (formError) {
            Object.keys(formError).forEach((key) => {
              // Ép kiểu cho key luôn
              setError(key as keyof Omit<FormData, 'confirm_password'>, {
                message: formError[key as keyof Omit<FormData, 'confirm_password'>],
                type: 'Server'
              })
            })
          }
          // if (formError?.email) {
          //   setError('email', {
          //     message: formError.email,
          //     type: 'Server'
          //   })
          // }
          // if (formError?.password) {
          //   setError('password', {
          //     message: formError.password,
          //     type: 'Server'
          //   })
          // }
        }
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
      <SEO title={t('register.meta.title')} description={t('register.meta.description')} />
      <div className='relative container min-h-[60vh]'>
        <div className='grid grid-cols-1 py-8 md:grid-cols-3 md:py-16 lg:grid-cols-5 lg:py-32 lg:pr-10'>
          <div className='md:col-span-3 md:mx-auto md:w-full md:max-w-md lg:col-span-2 lg:col-start-4 lg:mx-0 lg:max-w-none'>
            <motion.form
              className='rounded-sm bg-white p-10 shadow-xs dark:bg-slate-800 dark:shadow-slate-900/50'
              onSubmit={onSubmit}
              noValidate
              variants={reducedMotion ? undefined : containerVariants}
              initial={reducedMotion ? undefined : 'hidden'}
              animate={reducedMotion ? undefined : 'visible'}
            >
              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <div className='text-2xl text-gray-900 dark:text-gray-100'>{t('register.title')}</div>
              </motion.div>
              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <Input
                  className='relative mt-6'
                  classNameInput={classNames(
                    'w-full rounded-md border border-gray-300 dark:border-slate-600 p-3 shadow-xs dark:shadow-slate-900/30 outline-hidden focus:border-gray-500 dark:focus:border-slate-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    {
                      'border-red-500 focus:border-red-500 text-red-500': errors.email && errors.email.message
                    }
                  )}
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
                <Input
                  className='relative mt-2'
                  classNameInput={classNames(
                    'w-full rounded-md border border-gray-300 dark:border-slate-600 p-3 shadow-xs dark:shadow-slate-900/30 outline-hidden focus:border-gray-500 dark:focus:border-slate-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    {
                      'border-red-500 focus:border-red-500 text-red-500': errors.password && errors.password.message
                    }
                  )}
                  type='password'
                  name='password'
                  value={watchPassword}
                  autoComplete='on'
                  register={register}
                  placeholder='Password'
                  errorMessage={errors.password?.message}
                />
                <PasswordStrengthMeter password={watchPassword} />
              </motion.div>
              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <Input
                  className='relative mt-2'
                  classNameInput={classNames(
                    'w-full rounded-md border border-gray-300 dark:border-slate-600 p-3 shadow-xs dark:shadow-slate-900/30 outline-hidden focus:border-gray-500 dark:focus:border-slate-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500',
                    {
                      'border-red-500 focus:border-red-500 text-red-500':
                        errors.confirm_password && errors.confirm_password.message
                    }
                  )}
                  type='password'
                  name='confirm_password'
                  value={watchConfirmPassword}
                  autoComplete='on'
                  register={register}
                  placeholder='Confirm Password'
                  errorMessage={errors.confirm_password?.message}
                />
              </motion.div>
              {/* Nên cho 1 cái  thẻ div bao bọc bên ngoài để handle lỗi cho dễ */}

              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <div className='mt-2'>
                  <Button
                    isLoading={registerAccountMutation.isPending}
                    disabled={registerAccountMutation.isPending}
                    type='submit'
                    className='flex w-full items-center justify-center bg-red-500 px-2 py-4 text-sm text-white uppercase hover:bg-red-600'
                  >
                    {t('register.button')}
                  </Button>
                </div>
              </motion.div>

              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <div className='mt-6 flex flex-col items-center justify-center text-[13px] text-gray-700 dark:text-gray-300'>
                  <div className='px-3'>{t('register.termsIntro')}</div>
                  <div>
                    <Link to={path.home} className='text-orange dark:text-orange-400'>
                      {t('register.termsOfService')}
                    </Link>{' '}
                    &{' '}
                    <Link to={path.home} className='text-orange dark:text-orange-400'>
                      {t('register.privacyPolicy')}
                    </Link>
                  </div>
                </div>
              </motion.div>

              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <div className='mt-6 flex items-center justify-center text-center'>
                  <span className='mr-1 text-black/25 dark:text-gray-400'>{t('register.haveAccount')}</span>
                  <Link to={path.login} className='text-orange dark:text-orange-400'>
                    <span className=''>{t('register.loginLink')}</span>
                  </Link>
                </div>
              </motion.div>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
