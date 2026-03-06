import { InputHTMLAttributes, useState } from 'react'
import { useController, UseControllerProps, FieldValues, FieldPath } from 'react-hook-form'

// Khai báo type cho InputNumberProps version hoàn toàn khác
export type InputNumberProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  errorMessage?: string
  // name: string // để truyền vào tham số thứ nhất cho register
  classNameInput?: string
  classNameError?: string
  maxValue?: string
  // autoComplete?: string
} & InputHTMLAttributes<HTMLInputElement> &
  UseControllerProps<TFieldValues, TName>

function InputV2<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(props: InputNumberProps<TFieldValues, TName>) {
  const {
    type,
    onChange,
    className,
    classNameInput = 'w-full rounded-xs border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 p-2 md:p-3 text-sm md:text-base shadow-xs outline-hidden focus:border-gray-500 dark:focus:border-gray-400 dark:text-gray-100 dark:placeholder-gray-500',
    classNameError = 'mt-1 min-h-5 text-sm text-red-600 dark:text-red-400',
    value = '',
    ...rest
  } = props
  // useController dùng để custom những Input từ các thư viện như antd, MUI, mantine
  const { field, fieldState } = useController(props)
  const [localValue, setLocalValue] = useState<string>(field.value) //
  // Khi người dùng gõ số thì hàm onChange nó sẽ chạy
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const valueFromInput = event.target.value
    const numberCondition = type === 'number' && (/^\d+$/.test(valueFromInput) || valueFromInput === '')

    // Đoạn này là để phù hơp cho type='number' hay type='text', ... thì cũng có thể thực thi onChange và set value được
    if (numberCondition || type !== 'number') {
      setLocalValue(valueFromInput)
      // Gọi field.onChange để cập nhật vào state react hook form
      field.onChange(event)
      // Thực thi cái onchange callback từ bên ngoài truyền vào props
      onChange && onChange(event) // Ở đây chúng ta xuất ra cái event thì onChange bên ngoài nhận vào cái event(value thì nhận vào cái value)
    }
  }
  return (
    <div className={className}>
      <input
        className={classNameInput}
        // Tự sinh ra cho chúng ta với name là email
        {...rest}
        {...field}
        onChange={handleChange} // khi hàm onChange props truyền vào chạy thì onChange <input /> nó sẽ chạy
        value={value || localValue}
      />
      {/* cho m-height để khi mà không có lỗi thì nó vẫn chiếm được vị trí ở đó */}
      <div className={classNameError}>{fieldState.error?.message}</div>
    </div>
  )
}

export default InputV2
