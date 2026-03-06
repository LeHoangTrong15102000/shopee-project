import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useShallow } from 'zustand/react/shallow'
import { ExtendedPurchase, Purchase } from 'src/types/purchases.type'

// ── State & Actions ──────────────────────────────────────────────

interface CartState {
  items: ExtendedPurchase[]
}

interface CartActions {
  setItems: (items: ExtendedPurchase[]) => void
  toggleCheck: (purchaseIndex: number, checked: boolean) => void
  selectAll: (checked: boolean) => void
  updateQuantity: (productId: string, quantity: number) => void
  addOptimisticItem: (item: ExtendedPurchase) => void
  replaceTempItems: (realPurchase: Purchase) => void
  removeTempItems: () => void
  removeItems: (purchaseIds: string[]) => void
  restoreItems: (items: ExtendedPurchase[]) => void
  clearCheckedItems: () => void
  clearCart: () => void
}

type CartStore = CartState & CartActions

// ── Store ────────────────────────────────────────────────────────

export const useCartStore = create<CartStore>()(
  immer((set) => ({
    items: [],

    setItems: (items) =>
      set((state) => {
        state.items = items
      }),

    toggleCheck: (purchaseIndex, checked) =>
      set((state) => {
        if (state.items[purchaseIndex]) {
          state.items[purchaseIndex].isChecked = checked
        }
      }),

    selectAll: (checked) =>
      set((state) => {
        state.items.forEach((item) => {
          item.isChecked = checked
        })
      }),

    updateQuantity: (productId, quantity) =>
      set((state) => {
        const item = state.items.find((p) => p.product._id === productId)
        if (item) {
          item.buy_count = quantity
          item.disabled = false
        }
      }),

    addOptimisticItem: (item) =>
      set((state) => {
        state.items.push(item)
      }),

    replaceTempItems: (realPurchase) =>
      set((state) => {
        state.items = state.items.map((item) =>
          item._id.startsWith('temp-') ? { ...realPurchase, disabled: false, isChecked: true } : item
        )
      }),

    removeTempItems: () =>
      set((state) => {
        state.items = state.items.filter((item) => !item._id.startsWith('temp-'))
      }),

    removeItems: (purchaseIds) =>
      set((state) => {
        state.items = state.items.filter((item) => !purchaseIds.includes(item._id))
      }),

    restoreItems: (items) =>
      set((state) => {
        state.items.push(...items)
      }),

    clearCheckedItems: () =>
      set((state) => {
        state.items = state.items.filter((item) => !item.isChecked)
      }),

    clearCart: () =>
      set((state) => {
        state.items = []
      })
  }))
)

// ── Selector Hooks ───────────────────────────────────────────────

export const useCartItems = () => useCartStore((s) => s.items)

export const useCheckedItems = () => useCartStore(useShallow((s) => s.items.filter((item) => item.isChecked)))

export const useIsAllChecked = () => useCartStore((s) => s.items.length > 0 && s.items.every((item) => item.isChecked))

export const useCartItemCount = () => useCartStore((s) => s.items.length)

export const useCheckedItemsTotal = () =>
  useCartStore((s) =>
    s.items.filter((item) => item.isChecked).reduce((sum, item) => sum + item.price * item.buy_count, 0)
  )
