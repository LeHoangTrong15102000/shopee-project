import { Product } from './product.type'

// Status của purchase nó sẽ có các giá trị, riêng purchaseItem nó sẽ có các giá trị bên dưới
export type PurchaseStatus = -1 | 1 | 2 | 3 | 4 | 5 // Đây là các giá trị cho trạng thái đơn hàng

// giá trị 0 là giá trị status đặc biệt giành riêng cho purchaseListStatus, nó bao gồm cả purchase status item và purchaseList
export type PurchaseListStatus = PurchaseStatus | 0 // hoặc là string hoặc là number, bao gồm purchaseStatus và cả số 0

// Mỗi cái purchase nó sẽ có 1 cái status
export interface Purchase {
  _id: string // _id này là của đơn hàng được khởi tạo rôi thêm vào Cart
  buy_count: number
  price: number
  price_before_discount: number
  status: PurchaseStatus
  user: string
  product: Product
  createdAt: string
  updatedAt: string
}

export interface ExtendedPurchase extends Purchase {
  disabled: boolean
  isChecked: boolean
}
