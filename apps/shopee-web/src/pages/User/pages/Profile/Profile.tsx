import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Fragment, useContext, useEffect, useMemo, useState } from 'react'
import { Controller, useForm, FormProvider, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import userApi, { BodyUpdateProfile } from 'src/apis/user.api'
import Button from 'src/components/Button'
import Input from 'src/components/Input'
import InputNumber from 'src/components/InputNumber'
import ProfileCompletion from 'src/components/ProfileCompletion'
import { UserSchema, baseUserSchema } from 'src/utils/rules'
import DateSelect from '../../components/DateSelect'
import { toast } from 'react-toastify'
import { AppContext } from 'src/contexts/app.context'
import { setProfileToLS } from 'src/utils/auth'
import { getAvatarUrl, isAxiosUnprocessableEntityError } from 'src/utils/utils'
import { ErrorResponseApi } from 'src/types/utils.type'
import InputFile from 'src/components/InputFile'
import SEO from 'src/components/SEO'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import AvatarCropModal from 'src/components/AvatarCropModal'

// Khai báo 1 cái component Info
function Info() {
  const { t } = useTranslation('user')
  const {
    register,
    control,
    formState: { errors }
  } = useFormContext<FormData>()
  return (
    <Fragment>
      {/* Tên */}
      <div className='mt-3 flex flex-col flex-wrap sm:mt-6 sm:flex-row'>
        <div className='truncate pt-1 text-sm text-gray-500 capitalize sm:w-[30%] sm:pt-3 sm:text-right sm:text-base dark:text-gray-400'>
          {t('profile.name')}
        </div>
        <div className='sm:w-[70%] sm:pl-5'>
          <Input
            register={register}
            name='name'
            placeholder={t('profile.name')}
            errorMessage={errors.name?.message}
            autoComplete='on'
            classNameInput='w-full rounded-md border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-xs outline-hidden focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d]/30 dark:bg-slate-900 dark:text-gray-100'
          />
        </div>
      </div>
      {/* Số điện thoại */}
      <div className='mt-1 flex flex-col flex-wrap sm:mt-2 sm:flex-row'>
        <div className='truncate pt-1 text-sm text-gray-500 capitalize sm:w-[30%] sm:pt-3 sm:text-right sm:text-base dark:text-gray-400'>
          {t('profile.phone')}
        </div>
        <div className='sm:w-[70%] sm:pl-5'>
          <Controller
            control={control}
            name='phone'
            render={({ field }) => {
              return (
                <InputNumber
                  type='text'
                  className='grow'
                  placeholder={t('profile.phone')}
                  errorMessage={errors.phone?.message}
                  classNameInput='w-full rounded-md border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-xs outline-hidden focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d]/30 dark:bg-slate-900 dark:text-gray-100'
                  {...field}
                  onChange={(event) => field.onChange(event)}
                />
              )
            }}
          />
        </div>
      </div>
    </Fragment>
  )
}

// Khai báo 1 cái type là FormData để khi mà gửi api thay đổi thông tin
type FormData = Pick<UserSchema, 'name' | 'address' | 'phone' | 'date_of_birth' | 'avatar'>
// Type FormError
type FormDataError = Omit<FormData, 'date_of_birth'> & {
  date_of_birth: string
}

const profileSchema = baseUserSchema.pick({ name: true, address: true, phone: true, date_of_birth: true, avatar: true })
// URL.createObjectURL(file)

const Profile = () => {
  const { t } = useTranslation('user')
  const { setProfile, profile: profileFromContext } = useContext(AppContext)
  const [file, setFile] = useState<File>()
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false)
  // file này ban đầu không có giá trị gì hết
  const queryClient = useQueryClient()

  const previewImage = useMemo(() => {
    // Nếu mà có cái file thì gọi đến
    return file ? URL.createObjectURL(file) : ''
  }, [file])

  // Khai báo useForm
  const methods = useForm<FormData>({
    defaultValues: {
      name: '',
      address: '',
      phone: '',
      date_of_birth: new Date(1990, 0, 1), // giá trị khởi tạo là Date() nên khởi tọa theo như vậy
      avatar: ''
    },
    resolver: zodResolver(profileSchema)
  })
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    setError,
    formState: { errors }
  } = methods
  // theo dõi giá trị của Avatar mỗi lần changed
  const avatar = watch('avatar') // dùng watch() theo dõi giá trị của Avatar
  const reducedMotion = useReducedMotion()

  // useQuery để lấy ra cái getProfile
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => userApi.getProfile()
  })
  const profile = profileData?.data.data

  // Sử dụng useEffect() để đổ dữ liệu vào formProfile
  useEffect(() => {
    // set lại cái value cho thằng form
    if (profile) {
      setValue('name', profile.name)
      setValue('address', profile.address)
      setValue('phone', profile.phone)
      setValue('avatar', profile.avatar)
      setValue('date_of_birth', profile.date_of_birth ? new Date(profile.date_of_birth) : new Date(1990, 0, 1)) // date_of_birth nó sẽ có định dạng string kiểu ISO8601, tại vì ban đầu khi tạo tài khoản thì nó chưa có thuộc tính date_of_birth
    }
  }, [profile, setValue])

  // Khai báo 1 cái mutation update
  const updateProfileMutation = useMutation({
    mutationFn: (body: BodyUpdateProfile) => userApi.updateProfile(body)
  })

  // uploadAvatar
  const uploadAvatarMutation = useMutation({
    mutationFn: userApi.uploadAvatar
  })

  // Func HandleChange File và truyền xuống cho component InputFile
  const handleChangeFile = (file?: File) => {
    if (file) {
      setPendingFile(file)
      setIsCropModalOpen(true)
    }
  }

  // Handle crop modal close
  const handleCropModalClose = () => {
    setIsCropModalOpen(false)
    setPendingFile(null)
  }

  // Handle crop confirm
  const handleCropConfirm = (croppedFile: File) => {
    setFile(croppedFile)
    setIsCropModalOpen(false)
    setPendingFile(null)
  }

  // Func Submit xử lý lưu thông tin User
  // Khi mà Submit cái form sẽ nhận được dữ liệu từ Form, Do chung 1 cái handleSubmit
  const onSubmit = handleSubmit(async (data) => {
    // Muốn xử lý những cái sự kiện sau cái update này thì dùng await
    try {
      // Khai báo 1 cái giá trị avatarName để khi mà người dùng có thay đổi avatar
      let avatarName = avatar
      if (file) {
        // Nếu như có file thì sẽ gửi lên cái FormData cho nó
        const formData = new FormData() // FormData là Api của js
        formData.append('image', file)
        const uploadRes = await uploadAvatarMutation.mutateAsync(formData) // Khi nhấn vào lưu thì sẽ nhận về được 1 cái đoạn string
        avatarName = uploadRes.data.data // lấy được tên bức ảnh do sv trả về, Sau khi đã chọn được bức ảnh
        setValue('avatar', avatarName) // Chỉ nên đưa cái name ảnh từ server trả về vào thuộc tính `avatar` của updateProfile
      }
      //  Res này khi mà gọi Api thành công thì nó sẽ trả lại Profile có đầy đủ thuộc tính được khai báo Type User
      const res = await updateProfileMutation.mutateAsync(
        // Sev cần file ảnh định dạng là ISOString nên chúng ta cần phải chuyển nó về ISOString
        { ...data, date_of_birth: data.date_of_birth?.toISOString(), avatar: avatarName },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['profile'] })
          }
        }
      )
      if (res) {
        // console.log(res.data.data)
        setProfile(res.data.data)
        setProfileToLS(res.data.data)
        // Reset file state để hiển thị avatar từ server thay vì previewImage
        setFile(undefined)
        toast.success(res.data?.message, { autoClose: 1000, position: 'top-center' })
      }
    } catch (error) {
      // Xử lý lỗi từ phía server
      if (isAxiosUnprocessableEntityError<ErrorResponseApi<FormDataError>>(error)) {
        // Lấy lỗi và set vào RHF setError
        const formError = error.response?.data.data
        if (formError) {
          Object.keys(formError).forEach((key) => {
            // Ép kiểu cho key luôn
            setError(key as keyof FormDataError, {
              message: formError[key as keyof FormDataError],
              type: 'Server'
            })
          })
        }
      }
    }
  })

  return (
    <motion.div
      className='rounded-md bg-white px-2 pb-10 shadow-sm md:px-7 md:pb-20 dark:bg-slate-800'
      initial={reducedMotion ? undefined : { opacity: 0, y: 15 }}
      animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <SEO title={t('profile.title')} noindex />
      {/* Profile Completion Progress */}
      <ProfileCompletion user={profile || null} className='mt-2 mb-2 sm:mt-6 sm:mb-6' />

      {/* Tiêu đề */}
      <motion.div
        className='border-b border-b-gray-100 py-2 text-center sm:py-6 sm:text-left dark:border-b-slate-600'
        initial={reducedMotion ? undefined : { opacity: 0, x: -10 }}
        animate={reducedMotion ? undefined : { opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h1 className='text-base font-medium text-gray-700 capitalize sm:text-lg dark:text-gray-200'>
          {t('profile.title')}
        </h1>
        <div className='mt-0.75 text-xs sm:text-[.875rem] dark:text-gray-300'>{t('profile.description')}</div>
      </motion.div>
      {/* Form và Avatar */}
      <FormProvider {...methods}>
        <form className='mt-2 flex flex-col-reverse sm:mt-8 md:flex-row md:items-start' onSubmit={onSubmit}>
          {/* Form */}
          <div className='mt-2 grow sm:mt-6 md:mt-0 md:pr-4 lg:pr-12'>
            {/* flex-wrap đừng cho nó rớt ra bên ngoài */}
            {/* Email */}
            <div className='flex flex-col flex-wrap sm:flex-row'>
              <div className='truncate pt-1 text-sm text-gray-500 capitalize sm:w-[30%] sm:pt-3 sm:text-right sm:text-base dark:text-gray-400'>
                {t('profile.email')}
              </div>
              <div className='sm:w-[70%] sm:pl-5'>
                <div className='pt-1 text-sm text-gray-500 sm:pt-3 sm:text-base dark:text-gray-400'>
                  {profile?.email}
                </div>
              </div>
            </div>
            {/* Tên đăng nhập */}
            <div className='mt-1 flex flex-col flex-wrap sm:mt-4 sm:flex-row'>
              <div className='truncate pt-1 text-sm text-gray-500 capitalize sm:w-[30%] sm:pt-3 sm:text-right sm:text-base dark:text-gray-400'>
                {t('profile.username')}
              </div>
              <div className='sm:w-[70%] sm:pl-5'>
                <div className='pt-1 text-sm text-gray-500 sm:pt-3 sm:text-base dark:text-gray-400'>
                  {profile?.name}
                </div>
              </div>
            </div>
            {/* Info thông tin người dùng */}
            <Info />
            {/* Địa chỉ */}
            <div className='mt-1 flex flex-col flex-wrap sm:mt-2 sm:flex-row'>
              <div className='truncate pt-1 text-sm text-gray-500 capitalize sm:w-[30%] sm:pt-3 sm:text-right sm:text-base dark:text-gray-400'>
                {t('profile.address')}
              </div>
              <div className='sm:w-[70%] sm:pl-5'>
                <Input
                  register={register}
                  name='address'
                  placeholder={t('profile.address')}
                  errorMessage={errors.address?.message}
                  autoComplete='on'
                  classNameInput='w-full rounded-md border border-gray-300 dark:border-slate-600 px-3 py-2 shadow-xs outline-hidden focus:border-[#ee4d2d] focus:ring-1 focus:ring-[#ee4d2d]/30 dark:bg-slate-900 dark:text-gray-100'
                />
              </div>
            </div>
            {/* Ngày sinh, Nên cho thằng thành 1 cái component */}
            <Controller
              control={control}
              name='date_of_birth'
              render={({ field }) => {
                // Trong cái {...field} đã có value={field.value} rồi
                return (
                  <DateSelect
                    errorMessage={errors.date_of_birth?.message}
                    // Khi mà thằng profile.date_of_birth có giá trị thì nó sẽ truyền vào cho thằng field để xuất ra giá trị cho thằng value
                    // Do giá trị bên ngoài ban đầu có nên nó sẽ lấy giá trị b ên ngoài để hiện ra date_of_birth(render lần đầu khi mà Component chạy)
                    value={field.value}
                    onChange={field.onChange} // khi nhận được cái value từ DateSelect xong rồi thằng field.value nó sẽ lấy ra giá trị mới
                  />
                )
              }}
            />

            {/* button lưu thay đổi */}
            <div className='mt-1 flex flex-col flex-wrap sm:mt-3 sm:flex-row'>
              <div className='truncate pt-3 text-gray-500 capitalize sm:w-[30%] sm:text-right dark:text-gray-400' />
              <div className='w-full sm:w-[70%] sm:pl-5'>
                <Button
                  type='submit'
                  className='flex h-10 max-w-[220px] min-w-[100px] items-center justify-center rounded-lg bg-orange px-5 text-center text-sm text-white hover:bg-orange/90 dark:bg-orange-400 dark:hover:bg-orange-400/90'
                >
                  {t('profile.save')}
                </Button>
              </div>
            </div>
          </div>
          {/* Avatar */}
          <motion.div
            className='flex items-center justify-center md:w-56 md:border-l md:border-l-gray-100 lg:w-72 dark:md:border-l-slate-600'
            initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
            animate={reducedMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {/* flex-col cho nó dàn hàng ngang */}
            <div className='flex flex-col items-center'>
              {/* Avatar */}
              <div className='my-2 h-20 w-20 shrink-0 overflow-hidden rounded-full border border-black/10 sm:my-5 sm:h-24 sm:w-24 md:h-[115px] md:w-[115px]'>
                <img
                  src={previewImage || getAvatarUrl(profileFromContext?.avatar)}
                  alt='Avatar'
                  className='h-full w-full object-cover'
                />
              </div>
              {/* Input file */}
              <InputFile onChange={(value) => handleChangeFile(value)} />
              <div className='mt-1'>
                <div className='text-xs text-gray-400 sm:text-[0.875rem]'>{t('profile.maxFileSize')}</div>
                <div className='text-xs text-gray-400 sm:text-[0.875rem]'>{t('profile.fileFormat')}</div>
                <div></div>
              </div>
            </div>
          </motion.div>
        </form>
      </FormProvider>

      {/* Avatar Crop Modal */}
      <AvatarCropModal
        isOpen={isCropModalOpen}
        onClose={handleCropModalClose}
        onConfirm={handleCropConfirm}
        imageFile={pendingFile}
      />
    </motion.div>
  )
}

export default Profile
