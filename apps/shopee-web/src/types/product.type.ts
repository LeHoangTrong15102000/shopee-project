// Các thuộc tính trong danh sách sản phẩm
export interface Product {
  _id: string // id của sản phẩm
  images: string[]
  price: number
  rating: number
  price_before_discount: number
  quantity: number
  sold: number
  view: number
  name: string
  description: string
  category: {
    _id: string
    name: string
  }
  image: string
  location: string // địa điểm bán sản phẩm
  createdAt: string
  updatedAt: string
}
// Còn cái _id bên ngoài product là _id của mỗi sản phẩm trong giỏ

// Các thuộc tính của một list sản phẩm
export interface ProductList {
  products: Product[]
  pagination: {
    page: number
    limit: number
    page_size: number
  }
}

// Khai báo productList config, config từ APi trả về cho chúng ta
export interface ProductListConfig {
  page?: number | string
  limit?: number | string
  sort_by?: 'createdAt' | 'view' | 'sold' | 'price'
  order?: 'asc' | 'desc'
  exclude?: string // productId
  rating_filter?: number | string
  price_max?: number | string
  price_min?: number | string
  name?: string
  category?: string // CategoryId, nó sẽ lấy ra những Id sản phẩm tương tự nhau
}
