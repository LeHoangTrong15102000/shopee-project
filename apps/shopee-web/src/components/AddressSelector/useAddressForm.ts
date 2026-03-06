import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import addressApi from 'src/apis/address.api'
import {
  District,
  getDistrictsByProvince,
  getWardsByDistrict,
  streetSuggestions,
  vietnamProvinces,
  Ward
} from 'src/data/vietnamLocations'
import { Address, AddressFormData, AddressType } from 'src/types/checkout.type'
import { addressSchema, AddressSchemaFormData } from './addressForm.constants'

export function useAddressForm(address: Address | null, onSuccess: () => void) {
  const isEditing = !!address
  const [currentStep, setCurrentStep] = useState(1)
  const [districts, setDistricts] = useState<District[]>([])
  const [wards, setWards] = useState<Ward[]>([])
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false)
  const [filteredStreetSuggestions, setFilteredStreetSuggestions] = useState<string[]>([])

  const form = useForm<AddressSchemaFormData>({
    resolver: zodResolver(addressSchema),
    mode: 'onChange',
    defaultValues: address
      ? {
          fullName: address.fullName,
          phone: address.phone,
          province: address.province,
          provinceId: address.provinceId || '',
          district: address.district,
          districtId: address.districtId || '',
          ward: address.ward,
          wardId: address.wardId || '',
          street: address.street,
          addressType: address.addressType || 'home',
          label: address.label || '',
          isDefault: address.isDefault
        }
      : {
          fullName: '',
          phone: '',
          province: '',
          provinceId: '',
          district: '',
          districtId: '',
          ward: '',
          wardId: '',
          street: '',
          addressType: 'home',
          label: '',
          isDefault: false
        }
  })

  const { watch, setValue, trigger } = form
  const watchedProvinceId = watch('provinceId')
  const watchedDistrictId = watch('districtId')
  const watchedStreet = watch('street')
  const watchedAddressType = watch('addressType')
  const watchedProvince = watch('province')
  const watchedDistrict = watch('district')
  const watchedWard = watch('ward')
  const watchedFullName = watch('fullName')
  const watchedPhone = watch('phone')

  // Load districts when province changes
  useEffect(() => {
    if (watchedProvinceId) {
      setIsLoadingDistricts(true)
      setTimeout(() => {
        const newDistricts = getDistrictsByProvince(watchedProvinceId)
        setDistricts(newDistricts)
        setIsLoadingDistricts(false)
        if (!isEditing) {
          setValue('districtId', '')
          setValue('district', '')
          setValue('wardId', '')
          setValue('ward', '')
          setWards([])
        }
      }, 300)
    }
  }, [watchedProvinceId, setValue, isEditing])

  // Load wards when district changes
  useEffect(() => {
    if (watchedProvinceId && watchedDistrictId) {
      setIsLoadingWards(true)
      setTimeout(() => {
        const newWards = getWardsByDistrict(watchedProvinceId, watchedDistrictId)
        setWards(newWards)
        setIsLoadingWards(false)
        if (!isEditing) {
          setValue('wardId', '')
          setValue('ward', '')
        }
      }, 300)
    }
  }, [watchedProvinceId, watchedDistrictId, setValue, isEditing])

  // Filter street suggestions
  useEffect(() => {
    if (watchedStreet && watchedStreet.length > 0) {
      const filtered = streetSuggestions.filter((s) => s.toLowerCase().includes(watchedStreet.toLowerCase()))
      setFilteredStreetSuggestions(filtered.slice(0, 5))
    } else {
      setFilteredStreetSuggestions(streetSuggestions.slice(0, 5))
    }
  }, [watchedStreet])

  // Initialize districts and wards for editing
  useEffect(() => {
    if (isEditing && address?.provinceId) {
      const initialDistricts = getDistrictsByProvince(address.provinceId)
      setDistricts(initialDistricts)
      if (address.districtId) {
        const initialWards = getWardsByDistrict(address.provinceId, address.districtId)
        setWards(initialWards)
      }
    }
  }, [isEditing, address])

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceId = e.target.value
    const province = vietnamProvinces.find((p) => p.id === provinceId)
    setValue('provinceId', provinceId)
    setValue('province', province?.name || '')
    trigger(['provinceId', 'province'])
  }

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value
    const district = districts.find((d) => d.id === districtId)
    setValue('districtId', districtId)
    setValue('district', district?.name || '')
    trigger(['districtId', 'district'])
  }

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardId = e.target.value
    const ward = wards.find((w) => w.id === wardId)
    setValue('wardId', wardId)
    setValue('ward', ward?.name || '')
    trigger(['wardId', 'ward'])
  }

  const handleStreetSelect = (street: string) => {
    setValue('street', street)
    setShowStreetSuggestions(false)
    trigger('street')
  }

  const handleTypeSelect = (type: AddressType) => {
    setValue('addressType', type)
    if (type !== 'other') {
      setValue('label', '')
    }
  }

  const addressPreview = [watchedStreet, watchedWard, watchedDistrict, watchedProvince].filter(Boolean).join(', ')

  let stepProgress = 0
  if (watchedFullName && watchedPhone && !form.formState.errors.fullName && !form.formState.errors.phone)
    stepProgress = 1
  if (stepProgress === 1 && watchedProvince && watchedDistrict && watchedWard) stepProgress = 2
  if (stepProgress === 2 && watchedStreet && watchedAddressType) stepProgress = 3

  const canProceedToStep = (step: number) => {
    if (step === 1) return true
    if (step === 2)
      return watchedFullName && watchedPhone && !form.formState.errors.fullName && !form.formState.errors.phone
    if (step === 3) return stepProgress >= 2
    return false
  }

  const createMutation = useMutation({
    mutationFn: (data: AddressFormData) => addressApi.createAddress(data),
    onSuccess: () => {
      onSuccess()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: AddressFormData) => addressApi.updateAddress(address!._id, data),
    onSuccess: () => {
      onSuccess()
    }
  })

  const onSubmit = (data: AddressSchemaFormData) => {
    const formData = data as unknown as AddressFormData
    if (isEditing) {
      updateMutation.mutate(formData)
    } else {
      createMutation.mutate(formData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return {
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
  }
}
