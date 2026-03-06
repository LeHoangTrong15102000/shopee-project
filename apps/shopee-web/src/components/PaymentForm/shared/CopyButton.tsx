import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import Button from 'src/components/Button'

const CopyButton = memo(function CopyButton({ text, label }: { text: string; label: string }) {
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`Đã sao chép ${label}`, { autoClose: 1500, position: 'top-center' })
    } catch {
      toast.error('Không thể sao chép', { autoClose: 1500, position: 'top-center' })
    }
  }, [text, label])

  return (
    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
      <Button
        type='button'
        onClick={handleCopy}
        animated={false}
        className='rounded-lg bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-800 dark:bg-slate-700 dark:text-gray-400 dark:hover:bg-slate-600 dark:hover:text-gray-200'
        title={`Sao chép ${label}`}
      >
        <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'
          />
        </svg>
      </Button>
    </motion.div>
  )
})

export default CopyButton
