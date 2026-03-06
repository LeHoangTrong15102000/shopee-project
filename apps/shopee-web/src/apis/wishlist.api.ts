import { SuccessResponseApi } from 'src/types/utils.type'
import http from 'src/utils/http'
import {
  WishlistResponse,
  WishlistCheckResponse,
  WishlistCountResponse,
  WishlistClearResponse,
  AddToWishlistBody,
  WishlistItem
} from 'src/types/wishlist.type'

export interface ApiOptions {
  signal?: AbortSignal
}

// Helper to create mock product
const _mp = (
  id: number,
  name: string,
  price: number,
  priceBefore: number,
  catId: string,
  catName: string,
  sold: number,
  rating: number,
  qty: number,
  daysAgo: number
): WishlistItem => ({
  _id: `mock-wishlist-${id}`,
  user: 'mock-user-id',
  product: {
    _id: `mock-product-${id}`,
    name,
    price,
    price_before_discount: priceBefore,
    image: `https://picsum.photos/seed/shopee${id}/200`,
    images: [],
    category: { _id: catId, name: catName },
    quantity: qty,
    sold,
    view: sold * 3,
    rating,
    description: name,
    location: 'TP. Hồ Chí Minh',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  addedAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
})

// Mock data for fallback when API is not available
const mockWishlistItems: WishlistItem[] = [
  _mp(1, 'Áo thun nam cotton cao cấp', 250000, 350000, 'c1', 'Thời trang nam', 1500, 4.5, 100, 2),
  _mp(2, 'Tai nghe Bluetooth không dây chống ồn ANC', 450000, 650000, 'c2', 'Điện tử', 3200, 4.8, 50, 5),
  _mp(3, 'Balo laptop chống nước 15.6 inch', 320000, 480000, 'c3', 'Phụ kiện', 800, 4.3, 200, 1),
  _mp(4, 'Váy liền thân nữ phong cách Hàn Quốc', 189000, 299000, 'c4', 'Thời trang nữ', 2100, 4.6, 150, 3),
  _mp(5, 'Nồi chiên không dầu 5.5L đa năng', 890000, 1490000, 'c5', 'Gia dụng', 5600, 4.7, 80, 7),
  _mp(6, 'Son môi lì Velvet Lip Tint', 125000, 185000, 'c6', 'Làm đẹp', 8900, 4.4, 300, 0),
  _mp(7, 'Giày thể thao nam Air Cushion', 680000, 980000, 'c7', 'Thể thao', 1200, 4.2, 60, 4),
  _mp(8, 'Sách "Đắc Nhân Tâm" bìa cứng', 68000, 108000, 'c8', 'Sách', 12000, 4.9, 500, 10),
  _mp(9, 'Đồ chơi LEGO City 500 chi tiết', 520000, 750000, 'c9', 'Đồ chơi', 650, 4.6, 40, 6),
  _mp(10, 'Ốp lưng iPhone 15 Pro Max silicon', 59000, 120000, 'c3', 'Phụ kiện', 15000, 4.1, 1000, 1),
  _mp(11, 'Quần jean nam slim fit co giãn', 299000, 450000, 'c1', 'Thời trang nam', 3400, 4.5, 200, 8),
  _mp(12, 'Loa Bluetooth mini di động chống nước', 350000, 550000, 'c2', 'Điện tử', 2800, 4.7, 90, 2),
  _mp(13, 'Bộ chăn ga gối cotton 4 món', 450000, 680000, 'c5', 'Gia dụng', 1900, 4.3, 120, 12),
  _mp(14, 'Kem chống nắng SPF50+ PA++++', 195000, 280000, 'c6', 'Làm đẹp', 7200, 4.8, 400, 3),
  _mp(15, 'Áo khoác gió nữ 2 lớp chống UV', 345000, 520000, 'c4', 'Thời trang nữ', 1800, 4.4, 75, 5),
  _mp(16, 'Chuột gaming RGB 16000 DPI', 290000, 450000, 'c2', 'Điện tử', 4100, 4.6, 150, 9),
  _mp(17, 'Bình giữ nhiệt inox 500ml', 165000, 250000, 'c5', 'Gia dụng', 6300, 4.5, 350, 0),
  _mp(18, 'Túi xách nữ da PU thời trang', 275000, 420000, 'c4', 'Thời trang nữ', 2500, 4.3, 100, 4),
  _mp(19, 'Bàn phím cơ gaming Blue Switch', 750000, 1200000, 'c2', 'Điện tử', 980, 4.7, 45, 11),
  _mp(20, 'Serum Vitamin C dưỡng trắng da', 220000, 350000, 'c6', 'Làm đẹp', 5400, 4.6, 250, 2),
  _mp(21, 'Giày sandal nữ đế xuồng 7cm', 199000, 320000, 'c7', 'Thể thao', 1600, 4.2, 80, 6),
  _mp(22, 'Sách "Atomic Habits" tiếng Việt', 95000, 150000, 'c8', 'Sách', 9500, 4.9, 600, 1),
  _mp(23, 'Robot hút bụi lau nhà thông minh', 1850000, 2990000, 'c5', 'Gia dụng', 420, 4.5, 30, 14),
  _mp(24, 'Kính râm thời trang UV400 unisex', 135000, 220000, 'c3', 'Phụ kiện', 3800, 4.1, 500, 3),
  _mp(25, 'Áo polo nam cổ bẻ cao cấp', 215000, 320000, 'c1', 'Thời trang nam', 2700, 4.4, 180, 7),
  _mp(26, 'Máy sấy tóc ion âm 2200W', 385000, 580000, 'c6', 'Làm đẹp', 3100, 4.6, 100, 0),
  _mp(27, 'Đồng hồ thể thao nam chống nước', 490000, 790000, 'c7', 'Thể thao', 1400, 4.5, 55, 8),
  _mp(28, 'Bộ đồ chơi xếp hình gỗ cho bé', 145000, 230000, 'c9', 'Đồ chơi', 2200, 4.7, 200, 5)
]

const wishlistApi = {
  getWishlist: async (params?: { page?: number; limit?: number }, options?: ApiOptions) => {
    try {
      const response = await http.get<SuccessResponseApi<WishlistResponse>>('/wishlist', {
        params,
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [getWishlist] API not available, using mock data')
      return {
        data: {
          message: 'Lấy danh sách yêu thích thành công',
          data: {
            wishlist: mockWishlistItems,
            pagination: {
              page: params?.page || 1,
              limit: params?.limit || 10,
              total: mockWishlistItems.length,
              total_pages: 1
            }
          } as WishlistResponse
        }
      }
    }
  },

  addToWishlist: async (body: AddToWishlistBody, options?: ApiOptions) => {
    try {
      const response = await http.post<SuccessResponseApi<WishlistItem>>('/wishlist', body, {
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [addToWishlist] API not available, using mock data')
      return {
        data: {
          message: 'Thêm vào danh sách yêu thích thành công',
          data: mockWishlistItems[0]
        }
      }
    }
  },

  removeFromWishlist: async (productId: string, options?: ApiOptions) => {
    try {
      const response = await http.delete<SuccessResponseApi<{ message: string }>>(`/wishlist/${productId}`, {
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [removeFromWishlist] API not available, using mock data')
      return {
        data: {
          message: 'Xóa khỏi danh sách yêu thích thành công',
          data: { message: 'Xóa khỏi danh sách yêu thích thành công' }
        }
      }
    }
  },

  checkInWishlist: async (productId: string, options?: ApiOptions) => {
    try {
      const response = await http.get<SuccessResponseApi<WishlistCheckResponse>>(`/wishlist/check/${productId}`, {
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [checkInWishlist] API not available, using mock data')
      return {
        data: {
          message: 'Kiểm tra danh sách yêu thích thành công',
          data: { in_wishlist: true } as WishlistCheckResponse
        }
      }
    }
  },

  clearWishlist: async (options?: ApiOptions) => {
    try {
      const response = await http.delete<SuccessResponseApi<WishlistClearResponse>>('/wishlist', {
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [clearWishlist] API not available, using mock data')
      return {
        data: {
          message: 'Xóa toàn bộ danh sách yêu thích thành công',
          data: { deleted_count: mockWishlistItems.length } as WishlistClearResponse
        }
      }
    }
  },

  getWishlistCount: async (options?: ApiOptions) => {
    try {
      const response = await http.get<SuccessResponseApi<WishlistCountResponse>>('/wishlist/count', {
        signal: options?.signal
      })
      return response
    } catch (error) {
      console.warn('⚠️ [getWishlistCount] API not available, using mock data')
      return {
        data: {
          message: 'Lấy số lượng yêu thích thành công',
          data: { count: mockWishlistItems.length } as WishlistCountResponse
        }
      }
    }
  }
}

export default wishlistApi
