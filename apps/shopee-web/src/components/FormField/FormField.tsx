import type { ReactNode } from 'react'

interface FormFieldProps {
  label?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
  htmlFor?: string
}

const FormField = ({ label, error, required, className = '', children, htmlFor }: FormFieldProps) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>
          {label}
          {required && <span className='ml-1 text-red-500'>*</span>}
        </label>
      )}
      {children}
      {error && <p className='mt-1 min-h-5 text-sm text-red-600 dark:text-red-400'>{error}</p>}
    </div>
  )
}

export default FormField
