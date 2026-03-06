import React, { useRef } from 'react'
import ReactDOM from 'react-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Product } from 'src/types/product.type'
import { useFocusTrap } from 'src/hooks/useFocusTrap'
import Button from 'src/components/Button'

interface Props {
  children?: React.ReactNode
  open: boolean
  product: Product
  handleIsAgree: () => void
  handleIsCancel: () => void
}

const root = document.querySelector('body') as HTMLElement

const DeleteModal = ({ open = false, handleIsAgree, handleIsCancel, product }: Props) => {
  const { t } = useTranslation('common')
  const modalRef = useRef<HTMLDivElement>(null)
  useFocusTrap({ isOpen: open, containerRef: modalRef, onClose: handleIsCancel })

  const handleDelete = () => {
    handleIsAgree()
    handleIsCancel()
  }

  const handleCancel = () => {
    handleIsCancel()
  }

  if (open) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.removeProperty('overflow')
  }

  if (typeof document === 'undefined') return <div className='modal'></div>
  return ReactDOM.createPortal(
    <div
      className={`modal fixed inset-0 z-50 flex items-center justify-center p-5 ${open ? '' : 'invisible opacity-0'}`}
    >
      <motion.div
        className='overlay absolute inset-0 bg-black/40 dark:bg-black/60'
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        ref={modalRef}
        role='alertdialog'
        aria-labelledby='delete-modal-title'
        aria-describedby='delete-modal-description'
        className='modal-content relative z-50 h-full max-h-[317px] w-full max-w-[90vw] rounded-xl bg-white p-4 shadow-lg sm:max-w-[540px] sm:p-5 dark:bg-slate-800'
        animate={{ scale: open ? 1 : 0.9, opacity: open ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <motion.div
          id='delete-modal-title'
          className='mt-8 text-lg text-orange sm:text-[24px] dark:text-orange-400'
          animate={open ? { x: [0, -5, 5, -5, 5, 0] } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {t('deleteModal.title')}
        </motion.div>
        <div id='delete-modal-description' className='mt-10 text-base text-black/80 dark:text-gray-300'>
          {product?.name}
        </div>
        <div className='mt-[80px] flex items-center justify-between'>
          <Button
            variant='danger'
            onClick={handleDelete}
            className='h-[40px] max-w-[220px] min-w-[70px] grow rounded-sm px-5 text-[14px] shadow-xs'
          >
            {t('deleteModal.yes')}
          </Button>
          <Button
            variant='secondary'
            onClick={handleCancel}
            className='h-[40px] max-w-[220px] min-w-[70px] grow rounded-sm border border-gray-300 px-5 text-[14px] text-black shadow-xs dark:border-slate-600 dark:text-gray-200'
          >
            {t('deleteModal.no')}
          </Button>
        </div>
      </motion.div>
    </div>,
    root
  )
}

export default DeleteModal
