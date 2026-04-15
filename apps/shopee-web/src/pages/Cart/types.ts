import { Purchase } from 'src/types/purchases.type'

export interface ExtendedPurchase extends Purchase {
  disabled: boolean
  isChecked: boolean
}

export interface InlineStockAlertState {
  productId: string
  productName: string
  newStock: number
  severity: 'warning' | 'critical'
}
