import { Types } from 'mongoose'

export interface IUser {
  _id?: Types.ObjectId
  email: string
  name?: string
  password: string
  date_of_birth?: Date | string
  address?: string
  phone?: string
  roles: string[]
  avatar?: string
  /** AES-256-GCM encrypted TOTP secret (format: iv:authTag:ciphertext hex) */
  twoFactorSecret?: string
  /** Whether TOTP 2FA is currently enabled for this user */
  twoFactorEnabled?: boolean
  /** PBKDF2-hashed single-use backup codes */
  backupCodes?: string[]
  /** Whether this account has a user-chosen password (false for Google-OAuth accounts) */
  hasPassword?: boolean
  /** Timestamp of the last password change/reset — used to invalidate pre-change access tokens */
  passwordChangedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

export interface ICategory {
  _id?: Types.ObjectId
  name: string
}

export interface IProduct {
  _id?: Types.ObjectId
  name: string
  image: string
  images: string[]
  description?: string
  category: Types.ObjectId | ICategory
  price: number
  rating: number
  price_before_discount: number
  quantity: number
  sold: number
  view: number
  location?: string
  variants?: Array<{
    type: string
    name: string
    options: Array<{ name: string; value: string; image?: string }>
  }>
  createdAt?: Date
  updatedAt?: Date
}

export interface ISKU {
  _id?: Types.ObjectId
  value: string
  price: number
  stock: number
  image?: string
  product: Types.ObjectId | IProduct
  variant_values: Record<string, string>
  createdAt?: Date
  updatedAt?: Date
}

export interface IProductSkuSnapshot {
  _id?: Types.ObjectId
  product_name: string
  product_image: string
  sku_price: number
  sku_value: string
  sku_image: string
  variant_values: Record<string, string>
  quantity: number
  sku: Types.ObjectId | null
  product: Types.ObjectId | null
  order: Types.ObjectId | null
  createdAt?: Date
}

export interface IPurchase {
  _id?: Types.ObjectId
  user: Types.ObjectId | IUser
  product: Types.ObjectId | IProduct
  sku?: Types.ObjectId
  buy_count: number
  price: number
  price_before_discount: number
  status: number
  createdAt?: Date
  updatedAt?: Date
}

export interface IPayloadToken {
  id: string
  email: string
  roles: string[]
  created_at: string
  /** JWT ID — unique per token, used for refresh token reuse detection */
  jti?: string
  /** Token scope — "2fa_pending" for partial tokens issued mid-login when 2FA is required */
  scope?: string
}

export type FlashSaleStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED'

export interface IFlashSaleProduct {
  productId: Types.ObjectId
  skuId?: Types.ObjectId
  originalPrice: number
  flashPrice: number
  totalQuantity: number
  soldQuantity: number
  limitPerUser: number
}

export interface IFlashSale {
  _id?: Types.ObjectId
  name: string
  description?: string
  startTime: Date
  endTime: Date
  status: FlashSaleStatus
  products: IFlashSaleProduct[]
  createdBy: Types.ObjectId | IUser
  createdAt?: Date
  updatedAt?: Date
}
