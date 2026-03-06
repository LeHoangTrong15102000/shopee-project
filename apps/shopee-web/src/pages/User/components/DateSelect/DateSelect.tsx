import range from 'lodash/range'
import { useEffect, useState } from 'react'

interface Props {
  onChange?: (value: Date) => void
  value?: Date
  errorMessage?: string
}

const DateSelect = ({ onChange, value, errorMessage }: Props) => {
  // Do nó là useState nên nó chỉ có chạy 1 lần duy nhất, nên muốn thay đổi được chúng ta phải setState nó lại
  // Nên khi mà getProfile được gọi thành công thì thằng date nó cũng chỉ nhận giá trị khởi tạo là Date(1, 1, 1990) thôi
  const [date, setDate] = useState({
    date: value?.getDate() || 1,
    month: value?.getMonth() || 0,
    year: value?.getFullYear() || 1990
  })

  // Sử dụng useEffect lắng nghe sự thay đổi của value, giá trị nhận được của useEffect() y chang cũ khi onChange -> Nên dùng useEffect() chỉ để đồng bộ giá trị
  useEffect(() => {
    if (value) {
      setDate({
        date: value.getDate(),
        month: value.getMonth(),
        year: value.getFullYear()
      })
    }
  }, [value])

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value: valueFromSelect, name } = event.target
    // ghi đè lại giá trị state là date
    const newDate = {
      date: value?.getDate() || date.date,
      month: value?.getMonth() || date.month,
      year: value?.getFullYear() || date.year,
      [name]: Number(valueFromSelect) // Mình sẽ chuyển nó thành Number() cho nó chặt chẽ
    }
    setDate(newDate) // set lại giá trị cho Date trong localState

    // Kiểm tra nếu mà có onChange từ bên ngoài truyền vào, và truyền giá trị date vào
    // Truyền thằng date này vào component cha để validate cho nó
    onChange && onChange(new Date(newDate.year, newDate.month, newDate.date))
  }

  return (
    <div className='mt-2 flex flex-col flex-wrap sm:flex-row'>
      <div className='text-[rgba(85,85,85, .6)] truncate pt-3 capitalize sm:w-[30%] sm:text-right dark:text-gray-400'>
        Ngày sinh
      </div>
      <div className='sm:w-[70%] sm:pl-5'>
        <div className='flex flex-col gap-2 sm:flex-row sm:justify-between'>
          <select
            onChange={handleChange}
            name='date'
            className='h-10 w-full cursor-pointer rounded-xs border border-black/10 bg-white px-3 transition-colors hover:border-[#ee4d2d] sm:w-[30%] dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 dark:hover:border-orange-400'
            value={value?.getDate() || date.date}
          >
            <option disabled>Ngày</option>
            {/* Những option khác sẽ generate ra */}
            {range(1, 32).map((item) => (
              <option className='cursor-pointer hover:text-[#ee4d2d] dark:bg-slate-800' value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            onChange={handleChange}
            name='month'
            className='h-10 w-full cursor-pointer rounded-xs border border-black/10 bg-white px-3 transition-colors hover:border-[#ee4d2d] sm:w-[30%] dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 dark:hover:border-orange-400'
            value={value?.getMonth() || date.month}
          >
            <option disabled>Tháng</option>
            {range(0, 12).map((item) => (
              <option className='cursor-pointer hover:text-[#ee4d2d] dark:bg-slate-800' value={item} key={item}>
                {item + 1}
              </option>
            ))}
          </select>
          <select
            onChange={handleChange}
            name='year'
            className='h-10 w-full cursor-pointer rounded-xs border border-black/10 bg-white px-3 transition-colors hover:border-[#ee4d2d] sm:w-[30%] dark:border-slate-600 dark:bg-slate-800 dark:text-gray-100 dark:hover:border-orange-400'
            value={value?.getFullYear() || date.year}
          >
            <option disabled>Năm</option>
            {range(1990, 2024).map((item) => (
              <option className='cursor-pointer hover:text-[#ee4d2d] dark:bg-slate-800' value={item} key={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        {/* Thẻ div show lỗi */}
        <div className='mt-1 min-h-5 text-sm text-red-600'>{errorMessage}</div>
      </div>
    </div>
  )
}

export default DateSelect
