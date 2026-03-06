import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core'
import { restrictToWindowEdges } from '@dnd-kit/modifiers'
import { rectSortingStrategy, SortableContext } from '@dnd-kit/sortable'
import { AnimatePresence } from 'framer-motion'
import SEO from 'src/components/SEO'
import { useTranslation } from 'react-i18next'
import i18n from 'src/i18n/i18n'
import AddressForm from 'src/components/AddressSelector/AddressForm'
import Button from 'src/components/Button'
import { AddressType } from 'src/types/checkout.type'
import AddressCard from './components/AddressCard'
import AddressBookToolbar from './components/AddressBookToolbar'
import DeleteConfirmModal from './components/DeleteConfirmModal'
import EmptyState from './components/EmptyState'
import NoResultsState from './components/NoResultsState'
import SortableAddressCard from './components/SortableAddressCard'
import { useAddressBook } from './useAddressBook'

const ADDRESS_TYPE_CONFIG: Record<AddressType, { label: string; icon: React.ReactNode; color: string }> = {
  home: {
    label: i18n.t('address:type.home'),
    color: 'blue',
    icon: (
      <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
        <path d='M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z' />
      </svg>
    )
  },
  office: {
    label: i18n.t('address:type.office'),
    color: 'purple',
    icon: (
      <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
          fillRule='evenodd'
          d='M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z'
          clipRule='evenodd'
        />
      </svg>
    )
  },
  other: {
    label: i18n.t('address:type.other'),
    color: 'gray',
    icon: (
      <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
        <path
          fillRule='evenodd'
          d='M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z'
          clipRule='evenodd'
        />
      </svg>
    )
  }
}

const AddressBook = () => {
  const { t } = useTranslation(['user', 'address'])
  const {
    showForm,
    editingAddress,
    deletingAddressId,
    searchQuery,
    filterType,
    selectedIds,
    isSelectionMode,
    showBulkDeleteConfirm,
    activeId,
    rawAddresses,
    filteredAddresses,
    defaultAddress,
    otherAddresses,
    activeAddress,
    addressCounts,
    isLoading,
    deleteMutation,
    handleAddNew,
    handleEdit,
    handleFormClose,
    handleFormSuccess,
    handleDelete,
    confirmDelete,
    handleSetDefault,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDelete,
    confirmBulkDelete,
    toggleSelectionMode,
    setSearchQuery,
    setFilterType,
    setDeletingAddressId,
    setShowBulkDeleteConfirm,
    sensors,
    swapOnlyCollision,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  } = useAddressBook()

  const formatAddress = (address: { street: string; ward: string; district: string; province: string }) => {
    return `${address.street}, ${address.ward}, ${address.district}, ${address.province}`
  }

  const getAddressTypeInfo = (type?: AddressType) => {
    return ADDRESS_TYPE_CONFIG[type || 'home']
  }

  if (isLoading) {
    return (
      <div className='rounded-md bg-white px-2 pb-10 shadow-sm md:px-7 md:pb-20 dark:bg-slate-800'>
        <div className='flex h-64 items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-orange border-t-transparent dark:border-orange-400'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='rounded-md bg-white px-2 pb-10 shadow-sm md:px-7 md:pb-20 dark:bg-slate-800'>
      <SEO title={t('user:address.meta.title')} description={t('user:address.meta.description')} noindex />
      {/* Header */}
      <div className='flex flex-col gap-4 border-b border-b-gray-100 py-6 sm:flex-row sm:items-center sm:justify-between dark:border-b-slate-600'>
        <div className='text-center sm:text-left'>
          <h1 className='text-lg font-medium text-gray-700 capitalize dark:text-gray-200'>{t('user:address.title')}</h1>
          <div className='mt-1 text-sm text-gray-500 dark:text-gray-400'>
            {t('user:address.subtitle', { count: rawAddresses.length })}
          </div>
        </div>
        <div className='flex flex-wrap items-center justify-center gap-2 sm:justify-end sm:gap-3'>
          {rawAddresses.length > 0 && (
            <Button
              onClick={toggleSelectionMode}
              animated={false}
              className={`group relative flex h-9 items-center justify-center gap-1.5 overflow-hidden rounded-xl px-3 text-xs font-medium transition-all duration-300 sm:h-10 sm:gap-2 sm:px-5 sm:text-sm ${
                isSelectionMode
                  ? 'bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange/25'
                  : 'bg-linear-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
              }`}
            >
              <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
                />
              </svg>
              <span>{isSelectionMode ? t('user:address.cancelSelect') : t('user:address.selectMultiple')}</span>
            </Button>
          )}
          <Button
            onClick={handleAddNew}
            animated={false}
            className='group relative flex h-9 items-center justify-center gap-1.5 overflow-hidden rounded-xl bg-linear-to-r from-orange-500 via-orange-500 to-orange-600 px-3 text-xs font-medium text-white shadow-lg shadow-orange/30 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange/40 sm:h-10 sm:gap-2 sm:px-5 sm:text-sm'
          >
            <span className='absolute inset-0 bg-linear-to-r from-orange-600 via-orange-600 to-orange-700 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
            <svg
              className='relative z-10 h-4 w-4 transition-transform duration-300 group-hover:rotate-90'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4v16m8-8H4' />
            </svg>
            <span className='relative z-10'>{t('address:addNew')}</span>
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      {rawAddresses.length > 0 && (
        <AddressBookToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterType={filterType}
          onFilterChange={setFilterType}
          addressCounts={addressCounts}
          isSelectionMode={isSelectionMode}
          selectedCount={selectedIds.size}
          totalSelectableCount={filteredAddresses.filter((a) => !a.isDefault).length}
          onSelectAll={handleSelectAll}
          onBulkDelete={handleBulkDelete}
          ADDRESS_TYPE_CONFIG={ADDRESS_TYPE_CONFIG}
        />
      )}

      {/* Address List */}
      <div className='mt-6'>
        {rawAddresses.length === 0 ? (
          <EmptyState onAddNew={handleAddNew} />
        ) : filteredAddresses.length === 0 ? (
          <NoResultsState
            searchQuery={searchQuery}
            filterType={filterType}
            onClear={() => {
              setSearchQuery('')
              setFilterType('all')
            }}
          />
        ) : (
          <div className='space-y-6'>
            {/* Default Address - Always on top */}
            {defaultAddress && (
              <div>
                <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400'>
                  <svg className='h-4 w-4 text-orange dark:text-orange-400' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                      clipRule='evenodd'
                    />
                  </svg>
                  {t('user:address.defaultAddress')}
                </h3>
                <AddressCard
                  address={defaultAddress}
                  isDefault
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefault}
                  formatAddress={formatAddress}
                  getAddressTypeInfo={getAddressTypeInfo}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedIds.has(defaultAddress._id)}
                  onToggleSelect={handleToggleSelect}
                />
              </div>
            )}

            {/* Other Addresses - Reorderable Grid */}
            {otherAddresses.length > 0 && (
              <div>
                <h3 className='mb-3 flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400'>
                  <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                    />
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                    />
                  </svg>
                  {t('user:address.otherAddresses', { count: otherAddresses.length })}
                  {!isSelectionMode && (
                    <span className='ml-auto text-xs text-gray-400'>{t('user:address.dragToReorder')}</span>
                  )}
                </h3>
                <DndContext
                  sensors={isSelectionMode ? [] : sensors}
                  collisionDetection={swapOnlyCollision}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragCancel={handleDragCancel}
                  modifiers={[restrictToWindowEdges]}
                  measuring={{
                    droppable: {
                      strategy: MeasuringStrategy.Always
                    }
                  }}
                >
                  <SortableContext items={otherAddresses.map((addr) => addr._id)} strategy={rectSortingStrategy}>
                    <div className='grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'>
                      {otherAddresses.map((address) => (
                        <SortableAddressCard
                          key={address._id}
                          address={address}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onSetDefault={handleSetDefault}
                          formatAddress={formatAddress}
                          getAddressTypeInfo={getAddressTypeInfo}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedIds.has(address._id)}
                          onToggleSelect={handleToggleSelect}
                          isDragging={activeId === address._id}
                        />
                      ))}
                    </div>
                  </SortableContext>
                  <DragOverlay
                    dropAnimation={{
                      duration: 300,
                      easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)'
                    }}
                    modifiers={[restrictToWindowEdges]}
                  >
                    {activeAddress && (
                      <div className='scale-105 rotate-2 shadow-2xl'>
                        <AddressCard
                          address={activeAddress}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onSetDefault={handleSetDefault}
                          formatAddress={formatAddress}
                          getAddressTypeInfo={getAddressTypeInfo}
                          isSelectionMode={false}
                          isSelected={false}
                          onToggleSelect={handleToggleSelect}
                        />
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showForm && <AddressForm address={editingAddress} onClose={handleFormClose} onSuccess={handleFormSuccess} />}
      </AnimatePresence>

      <AnimatePresence>
        {deletingAddressId && (
          <DeleteConfirmModal
            onConfirm={confirmDelete}
            onCancel={() => setDeletingAddressId(null)}
            isLoading={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBulkDeleteConfirm && (
          <DeleteConfirmModal
            onConfirm={confirmBulkDelete}
            onCancel={() => setShowBulkDeleteConfirm(false)}
            isLoading={deleteMutation.isPending}
            title={t('user:address.bulkDeleteTitle', { count: selectedIds.size })}
            message={t('user:address.bulkDeleteMessage', { count: selectedIds.size })}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default AddressBook
