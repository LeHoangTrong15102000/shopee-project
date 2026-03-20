import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TOAST_MESSAGES, TEMP_ID_PREFIX, DEFAULT_USER_PLACEHOLDER } from '../constants';
import i18n from 'src/i18n/i18n';

vi.mock('src/i18n/i18n', () => ({
  default: {
    t: vi.fn((key: string) => key),
  },
}));

describe('TEMP_ID_PREFIX', () => {
  it('should be "temp-"', () => {
    expect(TEMP_ID_PREFIX).toBe('temp-');
  });
});

describe('DEFAULT_USER_PLACEHOLDER', () => {
  it('should be "current-user"', () => {
    expect(DEFAULT_USER_PLACEHOLDER).toBe('current-user');
  });
});

describe('TOAST_MESSAGES', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have ADD_TO_CART_SUCCESS with expected i18n key', () => {
    const message = TOAST_MESSAGES.ADD_TO_CART_SUCCESS;
    expect(message).toContain('cart:toast.addToCartSuccess');
    expect(i18n.t).toHaveBeenCalledWith('cart:toast.addToCartSuccess', undefined);
  });

  it('should have REMOVE_FROM_CART_SUCCESS as a function that returns string', () => {
    expect(typeof TOAST_MESSAGES.REMOVE_FROM_CART_SUCCESS).toBe('function');

    const singleMessage = TOAST_MESSAGES.REMOVE_FROM_CART_SUCCESS(1);
    expect(typeof singleMessage).toBe('string');
    expect(singleMessage).toContain('cart:toast.removeSuccess');

    const multipleMessage = TOAST_MESSAGES.REMOVE_FROM_CART_SUCCESS(3);
    expect(multipleMessage).toContain('cart:toast.removeSuccessMultiple');
  });

  it('should have REMOVE_FROM_CART_FINAL_SUCCESS as a function', () => {
    expect(typeof TOAST_MESSAGES.REMOVE_FROM_CART_FINAL_SUCCESS).toBe('function');

    const singleMessage = TOAST_MESSAGES.REMOVE_FROM_CART_FINAL_SUCCESS(1);
    expect(typeof singleMessage).toBe('string');
    expect(singleMessage).toContain('cart:toast.removeFinalSuccess');

    const multipleMessage = TOAST_MESSAGES.REMOVE_FROM_CART_FINAL_SUCCESS(5);
    expect(multipleMessage).toContain('cart:toast.removeFinalSuccessMultiple');
  });

  it('should have all expected message keys', () => {
    // Cart messages
    expect(TOAST_MESSAGES.ADD_TO_CART_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.ADD_TO_CART_ERROR).toBeDefined();
    expect(TOAST_MESSAGES.UPDATE_QUANTITY_ERROR).toBeDefined();
    expect(TOAST_MESSAGES.REMOVE_FROM_CART_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.REMOVE_FROM_CART_ERROR).toBeDefined();
    expect(TOAST_MESSAGES.REMOVE_FROM_CART_FINAL_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.RESTORE_ITEMS).toBeDefined();

    // Save for Later messages
    expect(TOAST_MESSAGES.SAVE_FOR_LATER_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.SAVE_FOR_LATER_ALREADY_SAVED).toBeDefined();
    expect(TOAST_MESSAGES.MOVE_TO_CART_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.CLEAR_SAVED_SUCCESS).toBeDefined();

    // Review messages
    expect(TOAST_MESSAGES.REVIEW_LIKE_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.REVIEW_UNLIKE_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.REVIEW_LIKE_ERROR).toBeDefined();

    // Wishlist messages
    expect(TOAST_MESSAGES.WISHLIST_ADD_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.WISHLIST_ADD_ERROR).toBeDefined();
    expect(TOAST_MESSAGES.WISHLIST_REMOVE_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.WISHLIST_REMOVE_ERROR).toBeDefined();
    expect(TOAST_MESSAGES.WISHLIST_LOGIN_REQUIRED).toBeDefined();

    // Notification messages
    expect(TOAST_MESSAGES.MARK_AS_READ_ERROR).toBeDefined();
    expect(TOAST_MESSAGES.MARK_ALL_AS_READ_SUCCESS).toBeDefined();
    expect(TOAST_MESSAGES.MARK_ALL_AS_READ_ERROR).toBeDefined();

    // Generic messages
    expect(TOAST_MESSAGES.GENERIC_ERROR).toBeDefined();
  });

  it('should call i18n.t with correct keys for getter properties', () => {
    vi.clearAllMocks();

    const _ = TOAST_MESSAGES.ADD_TO_CART_ERROR;
    expect(i18n.t).toHaveBeenCalledWith('cart:toast.addToCartError', undefined);

    vi.clearAllMocks();
    const __ = TOAST_MESSAGES.WISHLIST_ADD_SUCCESS;
    expect(i18n.t).toHaveBeenCalledWith('product:toast.wishlistAddSuccess', undefined);

    vi.clearAllMocks();
    const ___ = TOAST_MESSAGES.MARK_ALL_AS_READ_SUCCESS;
    expect(i18n.t).toHaveBeenCalledWith('notification:toast.markAllAsReadSuccess', undefined);
  });
});
