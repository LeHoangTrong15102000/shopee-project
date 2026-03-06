// Khi mà dùng function thì hả nên import React
import { InputHTMLAttributes, useState } from 'react'
import type { UseFormRegister, RegisterOptions, FieldValues, FieldPath } from 'react-hook-form'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from 'src/hooks/useReducedMotion'
import { errorSlideIn } from 'src/styles/animations'

// Mặc định là chúng ta sẽ lấy là FieldValues để nó không có báo lỗi nữa
// TFieldValue nó kế thừa từ FieldValues mặc định chúng ta sẽ lấy TFieldValues, giá trị mặc định có thể gán hoặc không gán đều không sao cả

// Thằng TFieldValues bên trong interface này thì nó chỉ được dùng trong phạm vi của interface thôi
// interface Props<TFieldValues extends FieldValues = FieldValues> extends InputHTMLAttributes<HTMLInputElement> {
//   errorMessage?: string
//   // name: string // để truyền vào tham số thứ nhất cho register
//   classNameInput?: string
//   classNameError?: string
//   classNameEye?: string
//   register?: UseFormRegister<TFieldValues> // có hay không cũng được
//   rules?: RegisterOptions // Là những options trong tham số thứ 2 của register{...}
//   // autoComplete?: string
//   name: FieldPath<TFieldValues>
// }

interface Props<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends InputHTMLAttributes<HTMLInputElement> {
  errorMessage?: string
  // name: string // để truyền vào tham số thứ nhất cho register
  classNameInput?: string
  classNameError?: string
  classNameEye?: string
  disableFloatingLabel?: boolean
  register?: UseFormRegister<TFieldValues> // có hay không cũng được
  rules?: RegisterOptions // Là những options trong tham số thứ 2 của register{...}
  // autoComplete?: string
  name: TName
}

// Cái Generic Type nó vẫn đóng vai trò là cầu nối dữ liệu giũa `nane` và `register`

// arrow function thì phải viết Generic type như thế này, muốn chặt chẽ hơn thì cho thêm = FieldValues vào
const Input = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  errorMessage,
  className,
  name,
  register,
  rules,
  classNameInput = 'w-full rounded-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-3 shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-gray-400 dark:text-gray-100 dark:placeholder-gray-500',
  classNameError = 'mt-1 min-h-5 text-sm text-red-600 dark:text-red-400',
  classNameEye = 'absolute right-[5px] top-[6px] h-8 w-8 md:right-[8px] md:top-[9px] md:h-6 md:w-6 cursor-pointer p-1 md:p-0 dark:text-gray-300',
  disableFloatingLabel,
  ...rest
}: // TFieldValues ở đây truyền thông qua
Props<TFieldValues, TName>) => {
  // state để lưu trữ việc hiển thị con mắt
  const [openEye, setOpenEye] = useState(false)
  // state để lưu trữ trạng thái focus của input -> label float lên khi focus
  const [isFocused, setIsFocused] = useState(false)
  const reducedMotion = useReducedMotion()
  const registerResult = register && name ? register(name, rules as RegisterOptions<TFieldValues, TName>) : null // {} // làm như này để tái sử dụng component Input ở các nơi khác nhau

  // Label hiển thị khi focus HOẶC khi có giá trị
  const hasValue = Boolean(rest.value)
  const showFloatingLabel = isFocused || hasValue

  // Label text: ưu tiên placeholder, fallback sang capitalize name
  const labelText = rest.placeholder || name?.slice(0, 1).toUpperCase() + name?.slice(1)

  // Handle focus/blur events, kết hợp với onFocus/onBlur từ props và registerResult
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    // Gọi onFocus từ props nếu có
    rest.onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    // Gọi onBlur từ registerResult (react-hook-form) nếu có
    registerResult?.onBlur?.(e)
    // Gọi onBlur từ props nếu có
    rest.onBlur?.(e)
  }

  // func toggle eye
  const handleToggleEye = () => {
    setOpenEye((prev) => !prev)
  }

  // func handle việc hiển thị giá trị ô Input khi mà toggleEye
  const handleTypeToggleEye = () => {
    if (rest.type === 'password') {
      return openEye ? 'text' : 'password'
    }
    // Còn không phải là `password` thì return lại rest.type
    return rest.type
  }

  // Tính toán className với border đỏ khi có error
  const getInputClassName = () => {
    const baseClass = classNameInput + ' transition-colors duration-150'
    if (errorMessage) {
      return baseClass.replace('border-gray-300', 'border-red-600')
    }
    return baseClass
  }

  // Tạo unique ID cho error message
  const errorId = errorMessage ? `${name}-error` : undefined

  return (
    <div className={className}>
      {!disableFloatingLabel && (
        <label
          className={`pointer-events-none absolute left-[10px] z-10 bg-white px-1 text-[12px] italic transition-all duration-200 ease-out dark:bg-slate-800 ${
            showFloatingLabel
              ? 'top-[-10px] text-gray-600 opacity-100 dark:text-gray-300'
              : 'top-[14px] text-gray-400 opacity-0 dark:text-gray-500'
          }`}
          htmlFor={name}
        >
          {labelText}
        </label>
      )}
      <input
        className={getInputClassName()}
        // Tự sinh ra cho chúng ta với name là email, nó sẽ tự sinh ra cho chúng ta nên không cần truyền vào
        {...registerResult}
        {...rest}
        // Override onFocus/onBlur để handle floating label
        onFocus={handleFocus}
        onBlur={handleBlur}
        // Ẩn placeholder khi label đang float
        placeholder={showFloatingLabel ? '' : rest.placeholder}
        // Ensure name and type are passed through properly
        name={name}
        type={handleTypeToggleEye()}
        // ARIA attributes for accessibility
        aria-invalid={errorMessage ? 'true' : 'false'}
        aria-describedby={errorId}
      />
      {/* Eye-open */}
      {rest.type === 'password' && openEye && (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className={classNameEye}
          onClick={handleToggleEye}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z'
          />
          <path strokeLinecap='round' strokeLinejoin='round' d='M15 12a3 3 0 11-6 0 3 3 0 016 0z' />
        </svg>
      )}
      {rest.type === 'password' && !openEye && (
        <svg
          xmlns='http://www.w3.org/2000/svg'
          fill='none'
          viewBox='0 0 24 24'
          strokeWidth={1.5}
          stroke='currentColor'
          className={classNameEye}
          onClick={handleToggleEye}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            d='M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88'
          />
        </svg>
      )}
      {/* Eye-close */}
      {/* cho m-height để khi mà không có lỗi thì nó vẫn chiếm được vị trí ở đó */}
      <AnimatePresence mode='wait'>
        {errorMessage ? (
          <motion.div
            key='error'
            className={classNameError}
            id={errorId}
            variants={reducedMotion ? undefined : errorSlideIn}
            initial={reducedMotion ? undefined : 'hidden'}
            animate={reducedMotion ? undefined : 'visible'}
            exit={reducedMotion ? undefined : 'exit'}
          >
            {errorMessage}
          </motion.div>
        ) : (
          <div className={classNameError} />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Input
