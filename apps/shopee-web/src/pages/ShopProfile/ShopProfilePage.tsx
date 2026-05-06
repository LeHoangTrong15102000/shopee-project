import { useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import shopApi from 'src/apis/shop.api'
import shopChatApi from 'src/apis/shopChat.api'
import { AppContext } from 'src/contexts/app.context'
import ShopMetrics from 'src/pages/ProductDetail/components/ShopMetrics'
import Product from 'src/pages/ProductList/components/Product'
import SEO from 'src/components/SEO'
import Button from 'src/components/Button'
import path from 'src/constant/path'
import { formatNumberToSocialStyle } from 'src/utils/utils'

const ShopProfilePage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useContext(AppContext)
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const LIMIT = 20

  // Fetch shop info
  const { data: shopData, isLoading: isShopLoading } = useQuery({
    queryKey: ['shop', id],
    queryFn: () => shopApi.getShop(id!),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  })

  const shop = shopData?.data?.data

  // Fetch shop products
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['shopProfileProducts', id, page],
    queryFn: () => shopApi.getShopProducts(id!, { page, limit: LIMIT }),
    enabled: Boolean(id),
    staleTime: 3 * 60 * 1000,
  })

  const products = productsData?.data?.data?.products ?? []
  const pagination = productsData?.data?.data?.pagination
  const totalPages = pagination ? pagination.page_size : 1

  // Optimistic follow/unfollow
  const followMutation = useMutation({
    mutationFn: () => shopApi.followShop(id!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['shop', id] })
      const prev = queryClient.getQueryData(['shop', id])
      queryClient.setQueryData(['shop', id], (old: typeof shopData) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              isFollowing: true,
              followerCount: (old.data.data.followerCount ?? 0) + 1,
            },
          },
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['shop', id], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', id] })
    },
  })

  const unfollowMutation = useMutation({
    mutationFn: () => shopApi.unfollowShop(id!),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['shop', id] })
      const prev = queryClient.getQueryData(['shop', id])
      queryClient.setQueryData(['shop', id], (old: typeof shopData) => {
        if (!old) return old
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              isFollowing: false,
              followerCount: Math.max((old.data.data.followerCount ?? 1) - 1, 0),
            },
          },
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['shop', id], ctx.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', id] })
    },
  })

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: () => shopChatApi.createConversation(id!),
    onSuccess: () => {
      navigate(path.conversations)
    },
  })

  const handleFollowClick = () => {
    if (!isAuthenticated) {
      navigate(path.login)
      return
    }
    if (shop?.isFollowing) {
      unfollowMutation.mutate()
    } else {
      followMutation.mutate()
    }
  }

  const handleChatClick = () => {
    if (!isAuthenticated) {
      navigate(path.login)
      return
    }
    createConversationMutation.mutate()
  }

  if (isShopLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <div className="container py-6">
          <div className="h-48 w-full animate-pulse rounded-sm bg-gray-200 dark:bg-slate-700" />
        </div>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
        <p className="text-gray-500 dark:text-gray-400">Shop not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <SEO title={shop.name} description={shop.description} />

      {/* Shop Header */}
      <div className="bg-white shadow-sm dark:bg-slate-800">
        <div className="container py-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Avatar + Info */}
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-orange bg-gray-200 dark:bg-slate-700">
                {shop.avatar ? (
                  <img src={shop.avatar} alt={shop.name} className="h-full w-full object-cover" />
                ) : (
                  <svg
                    className="h-full w-full p-4 text-gray-400 dark:text-gray-500"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {shop.name}
                </h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {formatNumberToSocialStyle(shop.followerCount)} followers
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    onClick={handleFollowClick}
                    disabled={followMutation.isPending || unfollowMutation.isPending}
                    className={`rounded-sm px-4 py-1.5 text-sm font-medium transition-colors ${
                      shop.isFollowing
                        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-200'
                        : 'border border-orange bg-white text-orange hover:bg-orange/5 dark:border-orange-400 dark:text-orange-400'
                    }`}
                  >
                    {shop.isFollowing ? 'Following' : '+ Follow'}
                  </Button>
                  <Button
                    onClick={handleChatClick}
                    disabled={createConversationMutation.isPending}
                    className="flex items-center gap-1.5 rounded-sm border border-orange px-4 py-1.5 text-sm font-medium text-orange hover:bg-orange/5 dark:border-orange-400 dark:text-orange-400"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Chat with shop
                  </Button>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="hidden h-20 w-px bg-gray-200 md:block dark:bg-slate-600" />
            <div className="flex-1">
              <ShopMetrics rating={shop.rating} shopId={id} />
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="container py-6">
        <h2 className="mb-4 text-base font-medium text-gray-900 dark:text-gray-100">
          Products ({shop.productCount})
        </h2>

        {isProductsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-sm bg-white shadow-sm dark:bg-slate-800">
                <div className="w-full pt-[100%] bg-gray-200 dark:bg-slate-700" />
                <div className="p-2">
                  <div className="mb-2 h-4 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-500 dark:text-gray-400">No products found</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((product) => (
                <Product key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-sm border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-sm border border-gray-300 px-3 py-1.5 text-sm text-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ShopProfilePage
