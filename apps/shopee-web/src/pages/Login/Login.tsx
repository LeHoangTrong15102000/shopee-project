import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useContext, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'

import classNames from 'classnames'
import { motion } from 'framer-motion'
import SEO from 'src/components/SEO'
import { toast } from 'react-toastify'
import authApi from 'src/apis/auth.api'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import path from 'src/constant/path'
import { AppContext } from 'src/contexts/app.context'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { STAGGER_DELAY, staggerContainer, staggerItem } from 'src/styles/animations'
import { ErrorResponseApi } from 'src/types/utils.type'
import { LoginSchema, loginSchema } from 'src/utils/rules'
import { generateNameId, isAxiosUnprocessableEntityError } from 'src/utils/utils'

type FormData = LoginSchema

const Login = () => {
  const { t } = useTranslation('auth')
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const navigate = useNavigate()
  const location = useLocation()
  const reducedMotion = useReducedMotion()
  const containerVariants = staggerContainer(STAGGER_DELAY.normal)
  // console.log(location)

  const purchaseIdFromLocation = useMemo(
    () => (location.state as { purchaseId: string } | null)?.purchaseId,
    [location]
  )
  const purchaseNameFromLocation = useMemo(
    () => (location.state as { purchaseName: string } | null)?.purchaseName,
    [location]
  )
  // console.log('CHOOSENPURCHASEHREF FROM LOCATION', choosenPurchaseHrefFromLocation)
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors }
  } = useForm<FormData>({
    mode: 'onTouched',
    resolver: zodResolver(loginSchema)
  }) // return cho chúng ta một cái object
  // const rules = getRules(getValues)

  const watchEmail = watch('email', '')
  const watchPassword = watch('password', '')

  const loginAccountMutation = useMutation({
    mutationFn: (body: FormData) => authApi.loginAccount(body),
    onSuccess: () => {
      toast.success(t('login.success'), { autoClose: 1000 })
    },
    onError: () => {
      toast.error(t('login.error'), { autoClose: 1000 })
    }
  })

  // data chính là giá trị trả ra khi mà onSubmit thành công
  const onSubmit = handleSubmit((data) => {
    // handleSubmit return về một callback
    // console.log(data)
    loginAccountMutation.mutate(data, {
      // data onSuccess là object do sv trả về
      onSuccess: (data) => {
        // console.log(data) // data đầu tiên là axiosRes trả về, data thứ 2 là Successapi sv trả về
        setIsAuthenticated(true)
        setProfile(data.data.data.user)
        navigate(
          purchaseIdFromLocation
            ? `${path.home}${generateNameId({
                name: purchaseNameFromLocation as string,
                id: purchaseIdFromLocation
              })}`
            : '/'
        )
      },
      onError: (error) => {
        //  isAxiosUn...<truyền vào kiểu type của data khi api lỗi>
        if (isAxiosUnprocessableEntityError<ErrorResponseApi<FormData>>(error)) {
          const formError = error.response?.data.data
          if (formError) {
            Object.keys(formError).forEach((key) => {
              setError(key as keyof FormData, {
                message: formError[key as keyof FormData],
                type: 'Server'
              })
            })
          }
        }
        // console.log(error)
      }
    })
  })

  // Viết các hàm sau cho có thể tái sử dụng được

  useEffect(() => {
    return () => {
      history.replaceState(null, '') // hàm history.replaceState là hàm có sẵn ở trên trình duyệt
    }
  }, [])

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
      <SEO title={t('login.meta.title')} description={t('login.meta.description')} />
      <div className='relative container min-h-[60vh] lg:min-h-[773.94px]'>
        <div className='grid grid-cols-1 py-8 md:grid-cols-3 md:py-16 lg:grid-cols-5 lg:py-32 lg:pr-10'>
          <div className='mt-10 md:col-span-3 md:mx-auto md:w-full md:max-w-md lg:col-span-2 lg:col-start-4 lg:mx-0 lg:max-w-none'>
            <motion.form
              className='rounded-sm bg-white p-10 shadow-xs dark:bg-slate-800 dark:shadow-slate-900/50'
              onSubmit={onSubmit}
              noValidate
              variants={reducedMotion ? undefined : containerVariants}
              initial={reducedMotion ? undefined : 'hidden'}
              animate={reducedMotion ? undefined : 'visible'}
            >
              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <div className='text-2xl text-gray-900 dark:text-gray-100'>{t('login.title')}</div>
              </motion.div>
              {/* Nên cho 1 cái  thẻ div bao bọc bên ngoài để handle lỗi cho dễ */}
              {/*  Input ở đây truyền hay không truyền generic type đều được, nếu mà không truyền generic type thì xóa register đi thì nó sẽ không gợi ý nữa */}
              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <Input
                  className='relative mt-6'
                  classNameInput={classNames(
                    'w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 shadow-xs dark:shadow-slate-900/30 outline-hidden focus:border-gray-500 dark:focus:border-slate-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500',
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
                <Input<FormData>
                  className='relative mt-2'
                  classNameInput={classNames(
                    'w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 p-3 shadow-xs dark:shadow-slate-900/30 outline-hidden focus:border-gray-500 dark:focus:border-slate-400 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500',
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
              </motion.div>

              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <div className='mt-2'>
                  <Button
                    // data-testid='button-element'
                    // role='button'
                    isLoading={loginAccountMutation.isPending}
                    disabled={loginAccountMutation.isPending}
                    type='submit'
                    className='flex w-full items-center justify-center bg-red-500 px-2 py-4 text-center text-sm text-white uppercase hover:bg-red-600'
                  >
                    {t('login.button')}
                  </Button>
                </div>
              </motion.div>

              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <div className='mt-3 text-right'>
                  <Link
                    to={path.forgotPassword}
                    className='text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
              </motion.div>

              {/* Divider */}
              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <div className='mt-4 flex items-center gap-3'>
                  <div className='h-px flex-1 bg-gray-200 dark:bg-slate-600' />
                  <span className='text-sm text-gray-400 select-none dark:text-gray-500'>{t('login.or')}</span>
                  <div className='h-px flex-1 bg-gray-200 dark:bg-slate-600' />
                </div>
              </motion.div>

              {/* Google Login Button (UI only) */}
              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <Button
                  variant='secondary'
                  animated={false}
                  disabled
                  className='mt-4 flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm shadow-xs'
                >
                  <svg viewBox='0 0 24 24' className='h-5 w-5' aria-hidden='true'>
                    <path
                      d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z'
                      fill='#4285F4'
                    />
                    <path
                      d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                      fill='#34A853'
                    />
                    <path
                      d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                      fill='#FBBC05'
                    />
                    <path
                      d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                      fill='#EA4335'
                    />
                  </svg>
                  {t('login.withGoogle')}
                </Button>
              </motion.div>

              <motion.div variants={reducedMotion ? undefined : staggerItem}>
                <div className='mt-6 flex items-center justify-center text-center'>
                  <span className='mr-1 text-black/25 dark:text-gray-400'>{t('login.newToShopee')}</span>
                  <Link to={path.register} className='text-orange dark:text-orange-400'>
                    <span className=''>{t('login.registerLink')}</span>
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

export default Login
