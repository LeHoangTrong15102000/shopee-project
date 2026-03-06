import {
  closestCenter,
  CollisionDetection,
  DragEndEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import addressApi from 'src/apis/address.api'
import { Address, AddressType } from 'src/types/checkout.type'

type FilterType = 'all' | AddressType

export const useAddressBook = () => {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    }),
    useSensor(KeyboardSensor)
  )

  const { data: addressData, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const res = await addressApi.getAddresses()
      return res.data.data
    }
  })

  const rawAddresses = addressData?.addresses || []

  const [orderedAddresses, setOrderedAddresses] = useState<Address[]>([])

  useMemo(() => {
    if (rawAddresses.length > 0 && orderedAddresses.length === 0) {
      setOrderedAddresses(rawAddresses)
    } else if (rawAddresses.length !== orderedAddresses.length) {
      const newIds = new Set(rawAddresses.map((a) => a._id))
      const existingIds = new Set(orderedAddresses.map((a) => a._id))
      const addedAddresses = rawAddresses.filter((a) => !existingIds.has(a._id))
      const remainingAddresses = orderedAddresses.filter((a) => newIds.has(a._id))
      setOrderedAddresses([...addedAddresses, ...remainingAddresses])
    }
  }, [rawAddresses])

  const filteredAddresses = useMemo(() => {
    let result = orderedAddresses.length > 0 ? orderedAddresses : rawAddresses

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (addr) =>
          addr.fullName.toLowerCase().includes(query) ||
          addr.phone.includes(query) ||
          addr.street.toLowerCase().includes(query) ||
          addr.district.toLowerCase().includes(query) ||
          addr.province.toLowerCase().includes(query)
      )
    }

    if (filterType !== 'all') {
      result = result.filter((addr) => (addr.addressType || 'home') === filterType)
    }

    return result
  }, [orderedAddresses, rawAddresses, searchQuery, filterType])

  const defaultAddress = filteredAddresses.find((addr) => addr.isDefault)
  const otherAddresses = filteredAddresses.filter((addr) => !addr.isDefault)

  // Custom collision detection: only allow drops on existing address items
  const swapOnlyCollision: CollisionDetection = useCallback(
    (args) => {
      const collisions = closestCenter(args)
      // Filter: only keep collisions with actual address item IDs
      const validIds = new Set(otherAddresses.map((addr) => addr._id))
      return collisions.filter((collision) => validIds.has(collision.id as string))
    },
    [otherAddresses]
  )

  const deleteMutation = useMutation({
    mutationFn: (id: string) => addressApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Xóa địa chỉ thành công', { autoClose: 1000, position: 'top-center' })
      setDeletingAddressId(null)
    }
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => addressApi.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      toast.success('Đặt địa chỉ mặc định thành công', { autoClose: 1000, position: 'top-center' })
    }
  })

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
    queryClient.invalidateQueries({ queryKey: ['addresses'] })
    setShowForm(false)
    setEditingAddress(null)
    toast.success(editingAddress ? 'Cập nhật địa chỉ thành công' : 'Thêm địa chỉ thành công', {
      autoClose: 1000,
      position: 'top-center'
    })
  }, [queryClient, editingAddress])

  const handleDelete = useCallback((id: string) => {
    setDeletingAddressId(id)
  }, [])

  const confirmDelete = useCallback(() => {
    if (deletingAddressId) {
      deleteMutation.mutate(deletingAddressId)
    }
  }, [deletingAddressId, deleteMutation])

  const handleSetDefault = useCallback(
    (id: string) => {
      setDefaultMutation.mutate(id)
    },
    [setDefaultMutation]
  )

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const nonDefaultIds = filteredAddresses.filter((a) => !a.isDefault).map((a) => a._id)
    if (selectedIds.size === nonDefaultIds.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(nonDefaultIds))
    }
  }, [filteredAddresses, selectedIds.size])

  const handleBulkDelete = useCallback(() => {
    setShowBulkDeleteConfirm(true)
  }, [])

  const confirmBulkDelete = useCallback(async () => {
    const idsToDelete = Array.from(selectedIds)
    for (const id of idsToDelete) {
      await deleteMutation.mutateAsync(id)
    }
    setSelectedIds(new Set())
    setIsSelectionMode(false)
    setShowBulkDeleteConfirm(false)
    toast.success(`Đã xóa ${idsToDelete.length} địa chỉ`, { autoClose: 1000, position: 'top-center' })
  }, [selectedIds, deleteMutation])

  const handleReorder = useCallback((newOrder: Address[]) => {
    setOrderedAddresses(newOrder)
  }, [])

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (over && active.id !== over.id) {
        // Swap: exchange positions of the two items directly
        const activeIndex = otherAddresses.findIndex((addr) => addr._id === active.id)
        const overIndex = otherAddresses.findIndex((addr) => addr._id === over.id)

        if (activeIndex !== -1 && overIndex !== -1) {
          const newOrder = [...otherAddresses]
          // Direct swap instead of arrayMove (insertion)
          const temp = newOrder[activeIndex]
          newOrder[activeIndex] = newOrder[overIndex]
          newOrder[overIndex] = temp
          const newFullOrder = defaultAddress ? [defaultAddress, ...newOrder] : newOrder
          handleReorder(newFullOrder)
        }
      }
    },
    [otherAddresses, defaultAddress, handleReorder]
  )

  const handleDragCancel = useCallback(() => {
    setActiveId(null)
  }, [])

  const activeAddress = activeId ? otherAddresses.find((addr) => addr._id === activeId) : null

  const addressCounts = useMemo(() => {
    const counts: Record<FilterType, number> = { all: rawAddresses.length, home: 0, office: 0, other: 0 }
    rawAddresses.forEach((addr) => {
      const type = addr.addressType || 'home'
      counts[type]++
    })
    return counts
  }, [rawAddresses])

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedIds(new Set())
  }, [isSelectionMode])

  return {
    // State
    showForm,
    editingAddress,
    deletingAddressId,
    searchQuery,
    filterType,
    selectedIds,
    isSelectionMode,
    showBulkDeleteConfirm,
    activeId,
    // Data
    rawAddresses,
    filteredAddresses,
    defaultAddress,
    otherAddresses,
    activeAddress,
    addressCounts,
    isLoading,
    // Mutations
    deleteMutation,
    // Handlers
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
    // DnD
    sensors,
    swapOnlyCollision,
    handleDragStart,
    handleDragEnd,
    handleDragCancel
  }
}
