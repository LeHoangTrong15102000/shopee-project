import { ExtendedPurchase } from 'src/types/purchases.type';

/**
 * Get the quantity of a specific product already in the cart.
 * Returns 0 if the product is not found in the cart.
 */
export const getProductQuantityInCart = (
  productId: string,
  cartItems: ExtendedPurchase[],
): number => {
  const item = cartItems.find((item) => item.product._id === productId);
  return item ? item.buy_count : 0;
};
