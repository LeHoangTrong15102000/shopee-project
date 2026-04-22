import React from 'react'
import { View, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useRouter, useLocalSearchParams } from 'expo-router'
import { Plus, MapPin } from 'lucide-react-native'
import { AppText, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import {
  useAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from '@/hooks/useAddresses'
import { useDialog } from '@/components/ui/DialogProvider'
import AddressCard from '@/components/address/AddressCard'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'

export default function AddressListScreen() {
  const colors = useColors()
  const router = useRouter()
  const { mode } = useLocalSearchParams<{ mode?: string }>()
  const isSelectMode = mode === 'select'
  const { showConfirm } = useDialog()

  const { data, isLoading } = useAddresses()
  const { mutate: deleteAddress } = useDeleteAddress()
  const { mutate: setDefault } = useSetDefaultAddress()

  const addresses = data?.data ?? []

  const handleDelete = (id: string) => {
    showConfirm(
      'Xóa địa chỉ',
      'Bạn có chắc chắn muốn xóa địa chỉ này?',
      () => deleteAddress(id),
      undefined,
      'horizontal'
    )
  }

  const handleSelect = (id: string) => {
    router.navigate({ pathname: '/checkout', params: { selectedAddressId: id } })
  }

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: 'Địa chỉ của tôi',
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {addresses.length === 0 && !isLoading ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState icon={MapPin} message="Chưa có địa chỉ nào" />
          </View>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={(item: any) => item._id}
            renderItem={({ item }: { item: any }) => (
              <AddressCard
                address={item}
                selectable={isSelectMode}
                onSelect={isSelectMode ? handleSelect : undefined}
                onEdit={
                  !isSelectMode ? (id) => router.push({ pathname: '/address-form', params: { id } }) : undefined
                }
                onDelete={!isSelectMode ? handleDelete : undefined}
                onSetDefault={!isSelectMode ? (id) => setDefault(id) : undefined}
              />
            )}
          />
        )}

        {/* FAB for adding new address */}
        {!isSelectMode && (
          <TouchableOpacity
            onPress={() => router.push('/address-form')}
            style={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
            }}>
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </>
  )
}
