import { useDebounce as useSharedDebounce } from '@shopee/shared-utils'
import { Schema } from 'src/utils/rules'

type FormData = Pick<Schema, 'name'>

const useDebounce = (value: null | FormData['name'], delay: number) => {
  const debouncedValue = useSharedDebounce(value, delay)
  return typeof debouncedValue === 'string' ? debouncedValue.trim() : debouncedValue
}

export default useDebounce
