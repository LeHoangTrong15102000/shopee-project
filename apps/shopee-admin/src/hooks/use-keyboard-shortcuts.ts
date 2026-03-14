import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SHORTCUT_ROUTES = [
  '/', // Alt+1 → Dashboard
  '/users', // Alt+2 → Users
  '/products', // Alt+3 → Products
  '/categories', // Alt+4 → Categories
  '/orders', // Alt+5 → Orders
  '/vouchers', // Alt+6 → Vouchers
  '/reviews', // Alt+7 → Reviews
  '/loyalty', // Alt+8 → Loyalty
  '/inventory', // Alt+9 → Inventory
];

export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!e.altKey) return;

      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
        return;
      }

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        e.preventDefault();
        navigate(SHORTCUT_ROUTES[num - 1]);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}

export { SHORTCUT_ROUTES };
