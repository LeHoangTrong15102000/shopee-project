import { AnimatePresence, motion } from 'framer-motion'
import { memo } from 'react'
import { Address } from 'src/types/checkout.type'
import AddressDetailsStep from './components/AddressDetailsStep'
import AddressFormFooter from './components/AddressFormFooter'
import AddressFormHeader from './components/AddressFormHeader'
import ContactInfoStep from './components/ContactInfoStep'
import LocationStep from './components/LocationStep'
import StepIndicator from './components/StepIndicator'
import { useAddressForm } from './useAddressForm'

interface AddressFormProps {
  address: Address | null
  onClose: () => void
  onSuccess: () => void
}

const AddressForm = memo(function AddressForm({ address, onClose, onSuccess }: AddressFormProps) {
  const {
    form,
    isEditing,
    currentStep,
    setCurrentStep,
    districts,
    wards,
    isLoadingDistricts,
    isLoadingWards,
    showStreetSuggestions,
    setShowStreetSuggestions,
    filteredStreetSuggestions,
    watchedProvinceId,
    watchedDistrictId,
    watchedAddressType,
    addressPreview,
    stepProgress,
    canProceedToStep,
    handleProvinceChange,
    handleDistrictChange,
    handleWardChange,
    handleStreetSelect,
    handleTypeSelect,
    onSubmit,
    isLoading
  } = useAddressForm(address, onSuccess)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className='fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs'
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className='my-8 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-slate-800 dark:ring-white/10'
        onClick={(e) => e.stopPropagation()}
      >
        <AddressFormHeader isEditing={isEditing} onClose={onClose} />

        <StepIndicator
          currentStep={currentStep}
          stepProgress={stepProgress}
          canProceedToStep={canProceedToStep}
          onStepClick={setCurrentStep}
        />

        <form onSubmit={form.handleSubmit(onSubmit)} className='max-h-[60vh] overflow-y-auto px-6 py-5'>
          <AnimatePresence mode='wait'>
            {currentStep === 1 && <ContactInfoStep form={form} />}

            {currentStep === 2 && (
              <LocationStep
                form={form}
                districts={districts}
                wards={wards}
                isLoadingDistricts={isLoadingDistricts}
                isLoadingWards={isLoadingWards}
                watchedProvinceId={watchedProvinceId}
                watchedDistrictId={watchedDistrictId}
                onProvinceChange={handleProvinceChange}
                onDistrictChange={handleDistrictChange}
                onWardChange={handleWardChange}
              />
            )}

            {currentStep === 3 && (
              <AddressDetailsStep
                form={form}
                watchedAddressType={watchedAddressType}
                addressPreview={addressPreview}
                showStreetSuggestions={showStreetSuggestions}
                filteredStreetSuggestions={filteredStreetSuggestions}
                onShowStreetSuggestions={setShowStreetSuggestions}
                onStreetSelect={handleStreetSelect}
                onTypeSelect={handleTypeSelect}
              />
            )}
          </AnimatePresence>
        </form>

        <AddressFormFooter
          currentStep={currentStep}
          isLoading={isLoading}
          canProceedToNext={!!canProceedToStep(currentStep + 1)}
          isEditing={isEditing}
          onBack={() => setCurrentStep(currentStep - 1)}
          onNext={() => setCurrentStep(currentStep + 1)}
          onClose={onClose}
          onSubmit={form.handleSubmit(onSubmit)}
        />
      </motion.div>
    </motion.div>
  )
})

export default AddressForm
