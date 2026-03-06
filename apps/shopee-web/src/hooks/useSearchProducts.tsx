import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Schema, baseSchema } from 'src/utils/rules'
import { zodResolver } from '@hookform/resolvers/zod'
import { useProductQueryStates } from './nuqs'

type FormData = Pick<Schema, 'name'>

const searchSchema = baseSchema.pick({ name: true })

/**
 * Hook for handling product search with automatic query cancellation
 * Tự động hủy các request search cũ khi có request mới
 */
const useSearchProducts = () => {
  const [searchValue, setSearchValue] = useState('') // khi mà search vào ô tìm kiếm thì sẽ set lại
  const [filters, setFilters] = useProductQueryStates()

  const {
    handleSubmit,
    register,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      name: searchValue
    },
    resolver: zodResolver(searchSchema)
  })

  /**
   * Function xử lý search product với query cancellation support
   * TanStack Query sẽ tự động hủy request cũ khi queryKey thay đổi
   */
  const onSubmitSearch = handleSubmit((data) => {
    // Nếu có order thì xóa order và sort_by khi search
    if (filters.order) {
      setFilters({ name: data.name, order: null, sort_by: 'createdAt' })
    } else {
      setFilters({ name: data.name })
    }

    // Note: TanStack Query sẽ tự động hủy các request đang pending
    // khi queryKey ['products', queryConfig] thay đổi
  })

  return {
    onSubmitSearch,
    register,
    searchValue,
    setSearchValue,
    errors
  }
}

export default useSearchProducts
