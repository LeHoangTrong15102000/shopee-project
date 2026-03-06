import { memo, useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import Button from 'src/components/Button'

const UploadReceipt = memo(function UploadReceipt({ onFileSelect }: { onFileSelect: (file: File | null) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null
      setSelectedFile(file)
      onFileSelect(file)

      if (file) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    },
    [onFileSelect]
  )

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null)
    setPreviewUrl(null)
    onFileSelect(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [onFileSelect])

  return (
    <div className='space-y-3'>
      <p className='text-sm font-medium text-gray-700 dark:text-gray-300'>
        Tải lên biên lai chuyển khoản (không bắt buộc)
      </p>

      {!selectedFile ? (
        <motion.label
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className='flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-blue-500 dark:hover:bg-blue-900/30'
        >
          <svg
            className='mb-2 h-10 w-10 text-gray-400 dark:text-gray-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
            />
          </svg>
          <span className='text-sm text-gray-600 dark:text-gray-400'>Nhấn để tải ảnh biên lai</span>
          <span className='mt-1 text-xs text-gray-400 dark:text-gray-500'>PNG, JPG tối đa 5MB</span>
          <input ref={fileInputRef} type='file' accept='image/*' onChange={handleFileChange} className='hidden' />
        </motion.label>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='relative rounded-xl border border-gray-200 bg-white p-3 dark:border-slate-600 dark:bg-slate-800'
        >
          <div className='flex items-center gap-3'>
            {previewUrl && <img src={previewUrl} alt='Receipt preview' className='h-16 w-16 rounded-lg object-cover' />}
            <div className='flex-1'>
              <p className='text-sm font-medium text-gray-800 dark:text-gray-200'>{selectedFile.name}</p>
              <p className='text-xs text-gray-500 dark:text-gray-400'>{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
            <Button
              type='button'
              onClick={handleRemoveFile}
              variant='ghost'
              animated={false}
              className='rounded-full p-1 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500'
            >
              <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
              </svg>
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
})

export default UploadReceipt
