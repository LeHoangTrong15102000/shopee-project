import React, { useState, useRef, useCallback } from 'react'
import { View, FlatList, ActivityIndicator } from 'react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react-native'
import { AppText, AppButton, EmptyState, Chip } from '@/components/ui'
import { useColors } from '@/hooks/useColors'
import ProductCard, { CARD_GAP } from '@/components/home/ProductCard'
import SearchBar from '@/components/search/SearchBar'
import SearchHistory from '@/components/search/SearchHistory'
import SearchSuggestions from '@/components/search/SearchSuggestions'
import SortBottomSheet, { SORT_OPTIONS, type SortOption } from '@/components/search/SortBottomSheet'
import FilterBottomSheet, { type FilterOptions } from '@/components/search/FilterBottomSheet'
import {
  useSearchProducts,
  useSearchSuggestions,
  useSearchHistory,
  useSaveSearchHistory,
  useDeleteHistoryItem,
  useClearSearchHistory,
} from '@/hooks/useSearch'
import { useRouter } from 'expo-router'
import { Search } from 'lucide-react-native'

type SearchMode = 'idle' | 'typing' | 'results'

export default function SearchScreen() {
  const colors = useColors()
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')
  const [mode, setMode] = useState<SearchMode>('idle')
  const [selectedSort, setSelectedSort] = useState<SortOption>(SORT_OPTIONS[0])
  const [filters, setFilters] = useState<FilterOptions>({})
  const sortSheetRef = useRef<BottomSheetModal>(null)
  const filterSheetRef = useRef<BottomSheetModal>(null)

  const { data: historyData } = useSearchHistory()
  const { data: suggestionsData } = useSearchSuggestions(mode === 'typing' ? keyword : '')
  const { mutate: saveHistory } = useSaveSearchHistory()
  const { mutate: deleteItem } = useDeleteHistoryItem()
  const { mutate: clearAll } = useClearSearchHistory()

  const searchResults = useSearchProducts({
    keyword: submittedKeyword,
    sortBy: selectedSort.sortBy,
    order: selectedSort.order,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    rating: filters.rating,
    enabled: mode === 'results',
  })

  const allProducts = searchResults.data?.pages.flatMap((p) => p.data.products) ?? []

  const handleChangeText = (text: string) => {
    setKeyword(text)
    if (text.length > 0) {
      setMode('typing')
    } else {
      setMode('idle')
    }
  }

  const handleSubmit = (kw: string) => {
    if (!kw.trim()) return
    setKeyword(kw)
    setSubmittedKeyword(kw)
    setMode('results')
    saveHistory(kw)
  }

  const handleBack = () => {
    router.back()
  }

  const handleClear = () => {
    setKeyword('')
    setMode('idle')
  }

  const handleSelectHistory = (kw: string) => {
    handleSubmit(kw)
  }

  const handleSelectSuggestion = (kw: string) => {
    handleSubmit(kw)
  }

  const handleSortApply = (option: SortOption) => {
    setSelectedSort(option)
  }

  const handleFilterApply = (f: FilterOptions) => {
    setFilters(f)
  }

  const loadMore = () => {
    if (searchResults.hasNextPage && !searchResults.isFetchingNextPage) {
      searchResults.fetchNextPage()
    }
  }

  const history = historyData?.data ?? []
  const suggestions = suggestionsData?.data ?? []

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <SearchBar
        value={keyword}
        onChangeText={handleChangeText}
        onSubmit={handleSubmit}
        onBack={handleBack}
        onClear={handleClear}
      />

      {mode === 'idle' && (
        <SearchHistory
          items={history}
          onSelect={handleSelectHistory}
          onDelete={deleteItem}
          onClearAll={clearAll}
        />
      )}

      {mode === 'typing' && (
        <SearchSuggestions suggestions={suggestions} onSelect={handleSelectSuggestion} />
      )}

      {mode === 'results' && (
        <View style={{ flex: 1 }}>
          <View className="flex-row gap-2 border-b border-neutrals900 px-4 py-2">
            <Chip
              variant="outline"
              size="sm"
              selected={false}
              onPress={() => sortSheetRef.current?.present()}
              icon={<ArrowUpDown />}>
              {selectedSort.label}
            </Chip>
            <Chip
              variant="outline"
              size="sm"
              selected={Object.keys(filters).some((k) => filters[k as keyof FilterOptions] != null)}
              onPress={() => filterSheetRef.current?.present()}
              icon={<SlidersHorizontal />}>
              Lọc
            </Chip>
          </View>

          {searchResults.isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : allProducts.length === 0 ? (
            <EmptyState icon={Search} message="Không tìm thấy sản phẩm" />
          ) : (
            <FlatList
              data={allProducts}
              keyExtractor={(item) => item._id}
              numColumns={2}
              columnWrapperStyle={{ gap: CARD_GAP, paddingHorizontal: 16, paddingTop: 8 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              onEndReached={loadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={
                searchResults.isFetchingNextPage ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 16 }} />
                ) : null
              }
              renderItem={({ item }) => <ProductCard product={item} />}
            />
          )}
        </View>
      )}

      <SortBottomSheet
        bottomSheetRef={sortSheetRef}
        selectedSort={selectedSort}
        onSelect={handleSortApply}
      />
      <FilterBottomSheet
        bottomSheetRef={filterSheetRef}
        initialFilters={filters}
        onApply={handleFilterApply}
      />
    </SafeAreaView>
  )
}
