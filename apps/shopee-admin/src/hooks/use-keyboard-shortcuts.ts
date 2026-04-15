import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from 'src/constants/routes'

const SHORTCUT_ROUTES = [
  ROUTES.DASHBOARD, // Alt+1 → Dashboard
  ROUTES.USERS, // Alt+2 → Users
  ROUTES.PRODUCTS, // Alt+3 → Products
  ROUTES.CATEGORIES, // Alt+4 → Categories
  ROUTES.ORDERS, // Alt+5 → Orders
  ROUTES.VOUCHERS, // Alt+6 → Vouchers
  ROUTES.REVIEWS, // Alt+7 → Reviews
  ROUTES.LOYALTY, // Alt+8 → Loyalty
  ROUTES.INVENTORY, // Alt+9 → Inventory
]

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.altKey) return

      const target = e.target as HTMLElement
      const tag = target.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
        return
      }

      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= 9) {
        e.preventDefault()
        navigate(SHORTCUT_ROUTES[num - 1])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
}

export { SHORTCUT_ROUTES }
