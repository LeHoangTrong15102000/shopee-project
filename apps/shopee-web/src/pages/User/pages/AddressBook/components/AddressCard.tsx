import { motion } from 'framer-motion'
import Button from 'src/components/Button'
import ShopeeCheckbox from 'src/components/ShopeeCheckbox'
import { Address, AddressType } from 'src/types/checkout.type'

export interface AddressCardProps {
  address: Address
  isDefault?: boolean
  onEdit: (address: Address) => void
  onDelete: (id: string) => void
  onSetDefault: (id: string) => void
  formatAddress: (address: Address) => string
  getAddressTypeInfo: (type?: AddressType) => { label: string; icon: React.ReactNode; color: string }
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}

const AddressCard = ({
  address,
  isDefault,
  onEdit,
  onDelete,
  onSetDefault,
  formatAddress,
  getAddressTypeInfo,
  isSelectionMode,
  isSelected,
  onToggleSelect
}: AddressCardProps) => {
  const typeInfo = getAddressTypeInfo(address.addressType)
  const displayLabel = address.addressType === 'other' && address.label ? address.label : typeInfo.label

  const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-700'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-700'
    },
    gray: {
      bg: 'bg-gray-100 dark:bg-slate-700',
      text: 'text-gray-700 dark:text-gray-300',
      border: 'border-gray-200 dark:border-slate-600'
    }
  }
  const typeColors = colorClasses[typeInfo.color] || colorClasses.gray

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -2 }}
      className={`group relative h-full overflow-hidden rounded-xl border p-3 transition-all duration-200 sm:p-5 ${
        isSelected
          ? 'border-orange bg-orange/5 ring-2 ring-orange/20 dark:border-orange-400 dark:bg-orange-400/10 dark:ring-orange-400/20'
          : isDefault
            ? 'border-orange bg-linear-to-br from-orange/5 to-orange/10 shadow-md dark:border-orange-400 dark:from-orange-400/10 dark:to-orange-400/20'
            : 'border-gray-200 bg-linear-to-br from-white via-gray-50/50 to-blue-50/30 shadow-xs hover:border-blue-200 hover:from-white hover:via-blue-50/30 hover:to-indigo-50/30 hover:shadow-lg dark:border-slate-600 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 dark:hover:border-slate-500 dark:hover:from-slate-700 dark:hover:via-slate-700 dark:hover:to-slate-600'
      }`}
    >
      {/* Selection Checkbox */}
      {isSelectionMode && !isDefault && (
        <div className='absolute top-3 left-3 z-10' onClick={(e) => e.stopPropagation()}>
          <ShopeeCheckbox checked={!!isSelected} onChange={() => onToggleSelect?.(address._id)} size='sm' />
        </div>
      )}

      {/* Default badge ribbon */}
      {isDefault && (
        <div className='absolute top-3 -right-8 rotate-45 bg-orange px-10 py-1 text-xs font-medium text-white shadow-xs'>
          Mặc định
        </div>
      )}

      {/* Drag handle indicator */}
      {!isSelectionMode && !isDefault && (
        <div className='absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100'>
          <svg className='h-5 w-5 text-gray-400 dark:text-gray-500' fill='currentColor' viewBox='0 0 20 20'>
            <path d='M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z' />
          </svg>
        </div>
      )}

      {/* Address Content */}
      <div className={`flex items-start gap-3 sm:gap-4 ${isSelectionMode && !isDefault ? 'ml-8' : ''}`}>
        {/* Address Type Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors sm:h-12 sm:w-12 ${
            isDefault
              ? 'bg-orange text-white dark:bg-orange-400'
              : `${typeColors.bg} ${typeColors.text} group-hover:bg-orange/10 group-hover:text-orange dark:group-hover:bg-orange-400/20 dark:group-hover:text-orange-400`
          }`}
        >
          {typeInfo.icon}
        </div>

        <div className='min-w-0 flex-1'>
          {/* Name and Phone */}
          <div className='flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2'>
            <h3 className='min-w-0 truncate bg-linear-to-r from-gray-800 to-gray-600 bg-clip-text text-sm font-semibold text-transparent sm:text-base dark:from-gray-100 dark:to-gray-300'>
              {address.fullName}
            </h3>
            <span className='hidden shrink-0 text-gray-300 sm:inline dark:text-gray-500'>|</span>
            <span className='flex shrink-0 items-center gap-1 text-xs text-gray-600 sm:text-sm dark:text-gray-400'>
              <svg className='h-3.5 w-3.5 sm:h-4 sm:w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                />
              </svg>
              {address.phone}
            </span>
          </div>

          {/* Address */}
          <p className='mt-1.5 line-clamp-2 text-xs leading-relaxed text-gray-700 sm:mt-2 sm:text-sm dark:text-gray-300'>
            {formatAddress(address)}
          </p>

          {/* Tags */}
          <div className='mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2'>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium sm:px-2.5 ${typeColors.bg} ${typeColors.text}`}
            >
              <span className='mr-1 flex h-3 w-3 items-center justify-center [&>svg]:h-3 [&>svg]:w-3'>
                {typeInfo.icon}
              </span>
              {displayLabel}
            </span>
            {isDefault && (
              <span className='inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 sm:px-2.5'>
                <svg className='mr-1 h-3 w-3' fill='currentColor' viewBox='0 0 20 20'>
                  <path
                    fillRule='evenodd'
                    d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                    clipRule='evenodd'
                  />
                </svg>
                Địa chỉ giao hàng
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      {!isSelectionMode && (
        <div className='mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:pt-4 dark:border-slate-600'>
          <div className='flex items-center gap-2'>
            {!isDefault && (
              <Button
                onClick={() => onSetDefault(address._id)}
                variant='outline'
                size='sm'
                animated={false}
                className='inline-flex items-center gap-1 rounded-lg border border-orange/30 bg-orange/5 px-2.5 py-1.5 text-xs font-medium text-orange transition-all hover:border-orange hover:bg-orange hover:text-white! sm:gap-1.5 sm:px-3 sm:text-sm dark:border-orange-400/30 dark:bg-orange-400/10 dark:text-orange-400 dark:hover:border-orange-400 dark:hover:bg-orange-400 dark:hover:text-white!'
              >
                <svg className='h-3.5 w-3.5 sm:h-4 sm:w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                </svg>
                Đặt mặc định
              </Button>
            )}
          </div>

          <div className='flex items-center gap-2'>
            <Button
              onClick={() => onEdit(address)}
              variant='secondary'
              size='sm'
              animated={false}
              className='inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:gap-1.5 sm:px-3 sm:text-sm dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600'
            >
              <svg className='h-3.5 w-3.5 sm:h-4 sm:w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                />
              </svg>
              Sửa
            </Button>
            {!isDefault && (
              <Button
                onClick={() => onDelete(address._id)}
                variant='ghost'
                size='sm'
                animated={false}
                className='inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 sm:gap-1.5 sm:px-3 sm:text-sm dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50'
              >
                <svg className='h-3.5 w-3.5 sm:h-4 sm:w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                  />
                </svg>
                Xóa
              </Button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default AddressCard
