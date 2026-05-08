import React, { useState } from 'react'
import { View, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack } from 'expo-router'
import { Ticket } from 'lucide-react-native'
import { useTranslation } from 'react-i18next'
import { AppText, Chip, EmptyState } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import {
  useAvailableVouchers,
  useCollectVoucher,
  usePersonalizedVouchers,
  useMyVouchers,
  useSaveVoucher,
  useVoucherByCode,
} from '@/hooks/useVouchers'
import VoucherCard from '@/components/vouchers/VoucherCard'
import VoucherSkeleton from '@/components/vouchers/VoucherSkeleton'
import CustomScreenHeader from '@/components/navigation/ScreenHeader'
import { Voucher } from '@/apis/voucher.api'

type TabKey = 'available' | 'personalized' | 'saved'
type SavedFilter = 'available' | 'used' | 'expired'

export default function VoucherScreen() {
  const { t } = useTranslation()
  const colors = useColors()
  const [activeTab, setActiveTab] = useState<TabKey>('available')
  const [collectingId, setCollectingId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [savedFilter, setSavedFilter] = useState<SavedFilter>('available')
  const [codeInput, setCodeInput] = useState('')
  const [codeError, setCodeError] = useState('')

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'available', label: t('vouchers.tab.available') },
    { key: 'personalized', label: t('vouchers.tab.availableForYou') },
    { key: 'saved', label: t('vouchers.tab.saved') },
  ]

  const SAVED_FILTERS: { key: SavedFilter; label: string }[] = [
    { key: 'available', label: t('vouchers.filter.active') },
    { key: 'used', label: t('vouchers.filter.used') },
    { key: 'expired', label: t('vouchers.filter.expired') },
  ]

  const { data: availableData, isLoading: isLoadingAvailable } = useAvailableVouchers()
  const { data: personalizedData, isLoading: isLoadingPersonalized } = usePersonalizedVouchers()
  const { data: myVouchersData, isLoading: isLoadingMy } = useMyVouchers(savedFilter)
  const { mutate: collectVoucher } = useCollectVoucher()
  const { mutate: saveVoucher } = useSaveVoucher()
  const { mutate: lookupCode, isPending: isLookingUp } = useVoucherByCode()

  const availableVouchers = (availableData?.data as unknown as { vouchers?: Voucher[] })?.vouchers ?? (availableData?.data as unknown as Voucher[]) ?? []
  const personalizedVouchers = (personalizedData?.data as unknown as { vouchers?: Voucher[] })?.vouchers ?? (personalizedData?.data as unknown as Voucher[]) ?? []
  const myVouchers = (myVouchersData?.data as unknown as { vouchers?: Voucher[] })?.vouchers ?? (myVouchersData?.data as unknown as Voucher[]) ?? []

  const handleCollect = (id: string) => {
    setCollectingId(id)
    collectVoucher(id, {
      onSettled: () => setCollectingId(null),
    })
  }

  const handleSave = (id: string) => {
    setSavingId(id)
    saveVoucher(id, {
      onSettled: () => setSavingId(null),
    })
  }

  const handleCodeLookup = () => {
    const trimmed = codeInput.trim()
    if (!trimmed) return
    setCodeError('')
    lookupCode(trimmed, {
      onError: () => setCodeError(t('vouchers.code.notFound')),
    })
  }

  const isLoading =
    activeTab === 'available'
      ? isLoadingAvailable
      : activeTab === 'personalized'
        ? isLoadingPersonalized
        : isLoadingMy

  const vouchers: Voucher[] =
    activeTab === 'available'
      ? availableVouchers
      : activeTab === 'personalized'
        ? personalizedVouchers
        : myVouchers

  return (
    <>
      <Stack.Screen
        options={{
          header: (props) => <CustomScreenHeader {...props} />,
          title: t('account.menu.vouchers'),
        }}
      />
      <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Tab chips */}
        <View
          className="flex-row gap-2 px-4 py-3 border-b border-neutrals900"
          style={{ backgroundColor: colors.background }}>
          {TABS.map((tab) => (
            <Chip
              key={tab.key}
              variant="outline"
              selected={activeTab === tab.key}
              onPress={() => setActiveTab(tab.key)}>
              {tab.label}
            </Chip>
          ))}
        </View>

        {/* Saved filter chips */}
        {activeTab === 'saved' && (
          <View className="flex-row gap-2 px-4 py-2 border-b border-neutrals900">
            {SAVED_FILTERS.map((f) => (
              <Chip
                key={f.key}
                variant="outline"
                selected={savedFilter === f.key}
                onPress={() => setSavedFilter(f.key)}>
                {f.label}
              </Chip>
            ))}
          </View>
        )}

        {/* Code lookup input */}
        <View className="px-4 py-3 border-b border-neutrals900">
          <View className="flex-row items-center rounded-lg border overflow-hidden"
            style={{ borderColor: codeError ? colors.error : colors.neutrals900 }}>
            <TextInput
              value={codeInput}
              onChangeText={(text) => { setCodeInput(text); setCodeError('') }}
              placeholder={t('vouchers.code.placeholder')}
              placeholderTextColor={colors.neutrals600}
              className="flex-1 px-3 py-3 font-sans-medium text-foreground bg-background"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              onPress={handleCodeLookup}
              disabled={isLookingUp || !codeInput.trim()}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: colors.primary,
                opacity: !codeInput.trim() ? 0.5 : 1,
              }}>
              {isLookingUp ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <AppText raw variant="bodySmall" weight="semibold" style={{ color: colors.primaryForeground }}>
                  {t('vouchers.code.lookup')}
                </AppText>
              )}
            </TouchableOpacity>
          </View>
          {codeError ? (
            <AppText raw variant="labelSmall" style={{ color: colors.error, marginTop: 4 }}>
              {codeError}
            </AppText>
          ) : null}
        </View>

        {isLoading ? (
          <VoucherSkeleton />
        ) : vouchers.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <EmptyState
              icon={Ticket}
              message={
                activeTab === 'available'
                  ? t('vouchers.empty.available')
                  : activeTab === 'personalized'
                    ? t('vouchers.empty.available')
                    : t('vouchers.empty.saved')
              }
            />
          </View>
        ) : (
          <FlatList
            data={vouchers}
            keyExtractor={(item: Voucher) => item._id}
            contentContainerStyle={{ paddingVertical: 8 }}
            renderItem={({ item }: { item: Voucher }) => (
              <VoucherCard
                voucher={item}
                showActions={activeTab !== 'saved'}
                onCollect={handleCollect}
                isCollecting={collectingId === item._id}
                onSave={handleSave}
                isSaving={savingId === item._id}
              />
            )}
            ListFooterComponent={<View style={{ height: 16 }} />}
          />
        )}
      </SafeAreaView>
    </>
  )
}
