import { memo, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import InputNumber, { InputNumberProps } from 'src/components/InputNumber'
import Button from 'src/components/Button'
import DeleteModal from '../DeleteModal'
import { Product } from 'src/types/product.type'

// Ngoài những thuộc tính có sẵn chúng ta sẽ thêm các thuộc tính khác thuộc trường Quantity
interface Props extends InputNumberProps {
  max?: number
  onIncrease?: (value: number) => void
  onDecrease?: (value: number) => void
  onType?: (value: number) => void
  onFocusOut?: (value: number) => void
  classNameWrapper?: string
  handleDelete?: (value: number) => void
  product?: Product
  isQuantityInCart?: boolean
}

const QuantityController = ({
  handleDelete,
  product,
  max,
  onIncrease,
  onDecrease,
  onFocusOut,
  onType,
  isQuantityInCart = false,
  classNameWrapper = 'ml-10',
  value, // Lấy ra value là thuộc tính của thẻ Input
  ...rest
}: Props) => {
  // State cho hiển thị modal -> Chỉ cần tạo cái idDelete rồi cái showConfirm sẽ phụ thuộc vòa
  const [idDelete, setIdDelete] = useState<null | number>(null)
  const openConfirm = useMemo(() => idDelete !== null, [idDelete])

  const [localValue, setLocalValue] = useState<number>(Number(value || 0))
  const [isShaking, setIsShaking] = useState(false)
  // Đã check chữ trong InputNumber component rồi nên không cần phải check nữa -> chỉ cần truyền giá trị vào
  // Hàm handleChange này dùng để truyền vào onChange gốc của chúng ta
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let _value = Number(event.target.value)
    if (max !== undefined && _value > max) {
      _value = max
    } else if (_value < 1) {
      _value = 1
    }

    // Khi mà có onType thì chúng ta sẽ truyền vào onType như này
    onType && onType(_value)
    // Cập nhật localValue tại đây luôn
    setLocalValue(_value)
  }

  // func tăng sản phẩm
  const increase = () => {
    let _value = Number(value || localValue) + 1
    if (max !== undefined && _value > max) {
      _value = max
    }
    if (max !== undefined && Number(value || localValue) >= max) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }

    onIncrease && onIncrease(_value)
    setLocalValue(_value)
  }

  // func showConfirm,
  const showConfirm = (_id: number) => {
    setIdDelete(_id)
  }

  // func hideConfirm
  const hideConfirm = () => {
    setIdDelete(null)
  }

  // handle xử lý việc show cái Modal ra, và xóa đi cái thằng
  const handleDeleteProduct = () => {
    handleDelete && handleDelete(Number(product?._id))
  }

  // fucn giảm sản phẩm
  const decrease = () => {
    let _value = Number(value || localValue) - 1
    if (_value < 1) {
      _value = 1 // reset lại giá trị value
      showConfirm(Number(product?._id))
    }
    if (Number(value || localValue) <= 1 && !isQuantityInCart) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
    }

    onDecrease && onDecrease(_value)
    setLocalValue(_value)
  }

  // func handle blur
  const handleBlur = (event: React.FocusEvent<HTMLInputElement, Element>) => {
    const _value = Number(event.target.value)
    onFocusOut && onFocusOut(_value)
  }

  return (
    <motion.div
      className={'flex items-center ' + classNameWrapper}
      animate={isShaking ? { x: [0, -4, 4, -4, 4, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div whileTap={{ scale: 0.85 }}>
        <Button
          animated={false}
          aria-label='Decrease quantity'
          onClick={decrease}
          className='flex h-10 w-10 items-center justify-center rounded-l-md border border-[rgba(0,0,0,.09)] bg-white text-gray-700 hover:bg-gray-50 sm:h-8 sm:w-8 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-4 w-4'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M19.5 12h-15' />
          </svg>
        </Button>
      </motion.div>
      <InputNumber
        classNameError='hidden'
        classNameInput='h-10 w-14 sm:h-8 p-1 text-center border border-[rgba(0,0,0,.09)] dark:border-slate-600 bg-white dark:bg-slate-800 dark:text-gray-100'
        className='shrink-0'
        type='text'
        role='spinbutton'
        aria-label='Quantity'
        aria-valuemin={1}
        aria-valuemax={max}
        aria-valuenow={Number(value || localValue)}
        onChange={handleChange}
        onBlur={handleBlur}
        value={value || localValue}
        {...rest}
      />
      <motion.div whileTap={{ scale: 0.85 }}>
        <Button
          animated={false}
          aria-label='Increase quantity'
          onClick={increase}
          className='flex h-10 w-10 items-center justify-center rounded-r-md border border-[rgba(0,0,0,.09)] bg-white text-gray-700 hover:bg-gray-50 sm:h-8 sm:w-8 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            strokeWidth={1.5}
            stroke='currentColor'
            className='h-4 w-4'
          >
            <path strokeLinecap='round' strokeLinejoin='round' d='M12 4.5v15m7.5-7.5h-15' />
          </svg>
        </Button>
      </motion.div>
      {/* Delete Modal */}
      {isQuantityInCart && (
        <DeleteModal
          product={product as Product} // Vì chúng ta biết chắc chắn là nó có nên chúng ta ép kiểu
          open={openConfirm}
          handleIsAgree={handleDeleteProduct}
          handleIsCancel={hideConfirm}
        />
      )}
    </motion.div>
  )
}

export default memo(QuantityController)
