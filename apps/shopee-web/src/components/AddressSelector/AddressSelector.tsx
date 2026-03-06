import { memo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Address } from 'src/types/checkout.type'
import addressApi from 'src/apis/address.api'
import Button from 'src/components/Button'
import AddressForm from './AddressForm'

interface AddressSelectorProps {
  selectedAddressId: string | null
  onSelect: (address: Address) => void
}

const AddressSelector = memo(function AddressSelector({ selectedAddressId, onSelect }: AddressSelectorProps) {
  const { t } = useTranslation('address')
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const queryClient = useQueryClient()

  const { data: addressData, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await addressApi.getAddresses()
      return res.data.data
    }
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => addressApi.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    }
  })

  const addresses = addressData?.addresses || []

  const handleAddNew = useCallback(() => {
    setEditingAddress(null)
    setShowForm(true)
  }, [])

  const handleEdit = useCallback((address: Address) => {
    setEditingAddress(address)
    setShowForm(true)
  }, [])

  const handleFormClose = useCallback(() => {
    setShowForm(false)
    setEditingAddress(null)
  }, [])

  const handleFormSuccess = useCallback(() => {
    setShowForm(false)
    setEditingAddress(null)
    queryClient.invalidateQueries({ queryKey: ['addresses'] })
  }, [queryClient])

  if (isLoading) {
    return (
      <div className='animate-pulse space-y-3'>
        {[1, 2].map((i) => (
          <div key={i} className='h-24 rounded-lg bg-gray-200 dark:bg-slate-700' />
        ))}
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        {/* Title removed - using SectionHeader in parent */}
        <Button
          onClick={handleAddNew}
          variant='text'
          animated={false}
          className='flex items-center gap-1 text-sm text-orange hover:text-orange/80 dark:hover:text-orange-400/80'
          aria-label={t('addNew')}
        >
          <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
          </svg>
          {t('addNew')}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className='rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-slate-600'>
          <svg
            className='mx-auto h-12 w-12 text-gray-400 dark:text-gray-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
            />
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
          </svg>
          <p className='mt-2 text-gray-500 dark:text-gray-400'>{t('noAddress')}</p>
          <Button onClick={handleAddNew} className='mt-4 rounded-lg bg-orange px-4 py-2 text-white hover:bg-orange/90'>
            {t('addFirst')}
          </Button>
        </div>
      ) : (
        <div className='space-y-3'>
          {addresses.map((address) => (
            <motion.div
              key={address._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all ${
                selectedAddressId === address._id
                  ? 'border-orange bg-orange/5 dark:bg-orange/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-slate-600 dark:hover:border-slate-500'
              }`}
              onClick={() => onSelect(address)}
              role='button'
              tabIndex={0}
              aria-pressed={selectedAddressId === address._id}
              onKeyDown={(e) => e.key === 'Enter' && onSelect(address)}
            >
              {address.isDefault && (
                <span className='absolute top-2 right-2 rounded-sm bg-orange/10 px-2 py-0.5 text-xs text-orange'>
                  {t('default')}
                </span>
              )}

              <div className='flex items-start gap-3'>
                <div
                  className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                    selectedAddressId === address._id ? 'border-orange' : 'border-gray-300 dark:border-slate-500'
                  }`}
                >
                  {selectedAddressId === address._id && <div className='h-3 w-3 rounded-full bg-orange' />}
                </div>

                <div className='flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='font-medium text-gray-900 dark:text-gray-100'>{address.fullName}</span>
                    <span className='text-gray-400 dark:text-gray-500'>|</span>
                    <span className='text-gray-600 dark:text-gray-300'>{address.phone}</span>
                  </div>
                  <p className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
                    {address.street}, {address.ward}, {address.district}, {address.province}
                  </p>

                  <div className='mt-2 flex gap-3'>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEdit(address)
                      }}
                      variant='text'
                      size='sm'
                      animated={false}
                      className='text-sm text-blue-600 hover:underline dark:text-blue-400'
                    >
                      {t('edit')}
                    </Button>
                    {!address.isDefault && (
                      <>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDefaultMutation.mutate(address._id)
                          }}
                          variant='text'
                          size='sm'
                          animated={false}
                          className='text-sm text-gray-600 hover:underline dark:text-gray-300'
                        >
                          {t('setDefault')}
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteMutation.mutate(address._id)
                          }}
                          variant='text'
                          size='sm'
                          animated={false}
                          className='text-sm text-red-600 hover:underline dark:text-red-400'
                        >
                          {t('delete')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && <AddressForm address={editingAddress} onClose={handleFormClose} onSuccess={handleFormSuccess} />}
      </AnimatePresence>
    </div>
  )
})

export default AddressSelector
