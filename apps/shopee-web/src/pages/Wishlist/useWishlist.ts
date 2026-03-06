import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'react-toastify'
import productApi from 'src/apis/product.api'
import purchaseApi from 'src/apis/purchases.api'
import wishlistApi from 'src/apis/wishlist.api'
import { purchasesStatus } from 'src/constant/purchase'
import { Product } from 'src/types/product.type'
import { mockCategories } from './wishlist.constants'

export function useWishlist(activeFilter: string, activeSort: string) {
  const queryClient = useQueryClient()

  // Fetch real products from API
  const { data: productsData } = useQuery({
    queryKey: ['products', { limit: 30, sort_by: 'sold' }],
    queryFn: () => productApi.getProducts({ limit: 30, sort_by: 'sold' as const })
  })

  // Fetch wishlist data (mock fallback since API not deployed)
  const { data: wishlistData, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getWishlist({ page: 1, limit: 50 })
  })

  // Merge: create wishlist items from real products or API wishlist
  const allWishlistItems = useMemo(() => {
    const apiWishlistItems = wishlistData?.data.data.wishlist ?? []
    const realProducts = productsData?.data.data.products ?? []

    // If we have real wishlist items with valid product data, use them
    if (apiWishlistItems.length > 0 && apiWishlistItems[0].product?.image) {
      return apiWishlistItems
    }

    // Otherwise, create mock wishlist entries from real products
    if (realProducts.length > 0) {
      return realProducts.slice(0, 28).map((product, index) => ({
        _id: `wishlist-${product._id}`,
        user: 'current-user',
        product,
        addedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
        mockCategory: mockCategories[index % mockCategories.length]
      }))
    }

    return apiWishlistItems
  }, [wishlistData, productsData])

  // Filter & Sort logic
  const wishlistItems = useMemo(() => {
    let items = [...allWishlistItems]

    // Apply filter
    if (activeFilter === 'sale') {
      items = items.filter((i) => i.product.price_before_discount > i.product.price)
    } else if (activeFilter === 'bestseller') {
      items = items.filter((i) => i.product.sold >= 2000)
    } else if (activeFilter === 'new') {
      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000
      items = items.filter((i) => new Date(i.addedAt).getTime() > threeDaysAgo)
    } else if (activeFilter === 'lowprice') {
      items = items.filter((i) => i.product.price < 300000)
    } else if (activeFilter === 'highrating') {
      items = items.filter((i) => i.product.rating >= 4.5)
    }

    // Apply sort
    if (activeSort === 'price-asc') items.sort((a, b) => a.product.price - b.product.price)
    else if (activeSort === 'price-desc') items.sort((a, b) => b.product.price - a.product.price)
    else if (activeSort === 'discount') {
      items.sort((a, b) => {
        const dA = a.product.price_before_discount - a.product.price
        const dB = b.product.price_before_discount - b.product.price
        return dB - dA
      })
    } else if (activeSort === 'bestseller') items.sort((a, b) => b.product.sold - a.product.sold)
    else items.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())

    return items
  }, [allWishlistItems, activeFilter, activeSort])

  // Extract product IDs for real-time price monitoring
  const productIds = useMemo(() => allWishlistItems.map((item) => item.product._id), [allWishlistItems])

  // Stats
  const totalValue = useMemo(
    () => allWishlistItems.reduce((sum, item) => sum + item.product.price, 0),
    [allWishlistItems]
  )
  const totalSavings = useMemo(
    () => allWishlistItems.reduce((sum, item) => sum + (item.product.price_before_discount - item.product.price), 0),
    [allWishlistItems]
  )

  // Insights
  const insights = useMemo(() => {
    if (allWishlistItems.length === 0) return null
    const catCount: Record<string, number> = {}
    let totalDiscount = 0
    let discountItems = 0
    allWishlistItems.forEach((item) => {
      const cat = item.product.category?.name || (item as { mockCategory?: string }).mockCategory || 'Khác'
      catCount[cat] = (catCount[cat] || 0) + 1
      if (item.product.price_before_discount > item.product.price) {
        totalDiscount += Math.round(
          ((item.product.price_before_discount - item.product.price) / item.product.price_before_discount) * 100
        )
        discountItems++
      }
    })
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]
    return {
      topCategory: topCat ? topCat[0] : 'N/A',
      topCategoryCount: topCat ? topCat[1] : 0,
      avgDiscount: discountItems > 0 ? Math.round(totalDiscount / discountItems) : 0,
      priceDropCount: allWishlistItems.filter(
        (i) =>
          i.product.price_before_discount > i.product.price &&
          Math.round(((i.product.price_before_discount - i.product.price) / i.product.price_before_discount) * 100) >=
            30
      ).length
    }
  }, [allWishlistItems])

  // Badge helpers
  const isRecentlyAdded = (addedAt: string) => {
    return Date.now() - new Date(addedAt).getTime() < 3 * 24 * 60 * 60 * 1000
  }
  const isTrending = (product: Product) => product.sold >= 3000 && product.rating >= 4.5
  const getStockStatus = (product: Product) => {
    if (product.quantity <= 0) return { label: 'Hết hàng', color: 'bg-red-500' }
    if (product.quantity <= 20) return { label: 'Sắp hết', color: 'bg-amber-500' }
    return null
  }
  const getDiscountPercent = (product: Product) => {
    if (product.price_before_discount <= product.price) return 0
    return Math.round(((product.price_before_discount - product.price) / product.price_before_discount) * 100)
  }

  // Mutations
  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Đã xóa khỏi danh sách yêu thích')
    }
  })

  const addToCartMutation = useMutation({
    mutationFn: (productId: string) => purchaseApi.addToCart({ product_id: productId, buy_count: 1 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases', { status: purchasesStatus.inCart }] })
      toast.success('Đã thêm vào giỏ hàng')
    }
  })

  return {
    allWishlistItems,
    wishlistItems,
    productIds,
    totalValue,
    totalSavings,
    insights,
    isLoading,
    isRecentlyAdded,
    isTrending,
    getStockStatus,
    getDiscountPercent,
    removeMutation,
    addToCartMutation
  }
}
