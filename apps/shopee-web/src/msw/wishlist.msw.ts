import { http, HttpResponse } from 'msw'
import config from 'src/constant/config'
import HTTP_STATUS_CODE from 'src/constant/httpStatusCode.enum'

const sampleWishlistItems = [
  {
    _id: 'wishlist-1',
    product: {
      _id: 'prod-1',
      name: 'Áo thun nam cotton cao cấp',
      price: 250000,
      price_before_discount: 350000,
      image: 'https://picsum.photos/200',
      rating: 4.5,
      sold: 1500
    },
    createdAt: '2024-01-01T00:00:00.000Z'
  }
]

const getWishlistRequest = http.get(`${config.baseUrl}wishlist`, () => {
  return HttpResponse.json(
    { message: 'Lấy danh sách yêu thích thành công', data: sampleWishlistItems },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

const addToWishlistRequest = http.post(`${config.baseUrl}wishlist`, async ({ request }) => {
  const body = (await request.json()) as { product_id: string }
  return HttpResponse.json(
    {
      message: 'Thêm vào danh sách yêu thích thành công',
      data: { _id: `wishlist_${Date.now()}`, product_id: body.product_id }
    },
    { status: HTTP_STATUS_CODE.Created }
  )
})

const removeFromWishlistRequest = http.delete(`${config.baseUrl}wishlist/:id`, () => {
  return HttpResponse.json(
    { message: 'Xóa khỏi danh sách yêu thích thành công', data: { deleted_count: 1 } },
    { status: HTTP_STATUS_CODE.Ok }
  )
})

const wishlistRequests = [getWishlistRequest, addToWishlistRequest, removeFromWishlistRequest]

export default wishlistRequests
