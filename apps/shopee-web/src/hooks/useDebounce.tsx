import { useState, useEffect } from 'react'
import { Schema } from 'src/utils/rules'

// Tạo 1 cái useDebounce để sử dụng cho việc search data
/**
 * // Bài giảng Header#3 phần tiktok
 * Trong hàm useDebounce, mỗi khi value trong mảng deps thay đổi thì clearnup function được gọi, nên sẽ clear timeout trước đó đi (huỷ những lần trước đi). Vì vậy, cho tới khi người dùng ngừng gõ 500ms API mới được gọi (mình có nói điều này ở 07:06 nha các bạn 😘😘).
 */
type FormData = Pick<Schema, 'name'>

const useDebounce = (value: null | FormData['name'], delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value?.trim() as string), delay)

    // clean up timeout, sau khi người dùng hết gõ thì nó sẽ clear cái timeout đi sau 500ms
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return debouncedValue
}

export default useDebounce
