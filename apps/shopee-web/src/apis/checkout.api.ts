import { SuccessResponseApi } from 'src/types/utils.type';
import {
  ShippingMethod,
  PaymentMethod,
  Order,
  CreateOrderBody,
  CheckoutSummary,
} from 'src/types/checkout.type';
import http from 'src/utils/http';

// Mock shipping methods - Shopee style with details
const mockShippingMethods: ShippingMethod[] = [
  {
    _id: 'instant',
    name: 'Instant',
    description: 'Super fast delivery within 4 hours',
    price: 112600,
    estimatedDays: '4 hours',
    icon: 'truck',
    type: 'instant',
    deliveryHours: 4,
    details: [
      { text: 'Get ₫20,000 voucher if order arrives late', type: 'voucher' },
      { text: 'Free shipping for orders over ₫0', type: 'free_threshold' },
      { text: 'This channel does not support Shopee Inspection', type: 'note' },
    ],
  },
  {
    _id: 'bulky',
    name: 'Bulky Items',
    description: 'Specialized delivery for large items',
    price: 30800,
    estimatedDays: '2-4 days',
    icon: 'box',
    type: 'standard',
    details: [
      { text: 'Get ₫15,000 voucher if order arrives late', type: 'voucher' },
      { text: '95% off for orders over ₫100,000 (max ₫200,000 discount)', type: 'discount' },
      { text: 'Free shipping for orders over ₫500,000', type: 'free_threshold' },
      { text: 'Free shipping for orders over ₫1,000,000', type: 'free_threshold' },
    ],
  },
  {
    _id: 'express',
    name: 'Express',
    description: 'Fast delivery in 1-2 days',
    price: 30800,
    estimatedDays: '1 day',
    icon: 'rocket',
    type: 'express',
    details: [
      { text: 'Get ₫15,000 voucher if order arrives late', type: 'voucher' },
      { text: 'Free shipping for orders over ₫0', type: 'free_threshold' },
    ],
  },
  {
    _id: 'economy',
    name: 'Economy',
    description: 'Affordable delivery in 3-5 days',
    price: 16500,
    estimatedDays: '3-5 days',
    icon: 'standard',
    type: 'economy',
    details: [
      { text: 'Get ₫15,000 voucher if order arrives late', type: 'voucher' },
      { text: 'Free shipping for orders over ₫0', type: 'free_threshold' },
    ],
  },
  {
    _id: 'pickup',
    name: 'Pickup Locker',
    description: 'Pick up at a pickup point',
    price: 30800,
    estimatedDays: '2-3 days',
    icon: 'locker',
    type: 'pickup',
    details: [{ text: 'Free shipping for orders over ₫0', type: 'free_threshold' }],
  },
];

// Mock payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    _id: 'cod',
    type: 'cod',
    name: 'Cash on Delivery (COD)',
    description: 'Pay with cash when you receive the order',
    icon: 'cod',
    isAvailable: true,
  },
  {
    _id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Bank Transfer',
    description: 'Transfer via bank account',
    icon: 'bank_transfer',
    isAvailable: true,
  },
  {
    _id: 'e_wallet',
    type: 'e_wallet',
    name: 'E-Wallet',
    description: 'Pay via MoMo, ZaloPay, VNPay',
    icon: 'e_wallet',
    isAvailable: true,
  },
  {
    _id: 'credit_card',
    type: 'credit_card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, JCB',
    icon: 'credit_card',
    isAvailable: true,
  },
];

const checkoutApi = {
  getShippingMethods: async () => {
    try {
      const response = await http.get<SuccessResponseApi<ShippingMethod[]>>(
        '/orders/shipping/methods',
      );
      return response;
    } catch (error) {
      console.warn('Shipping API not available, using mock data');
      return {
        data: {
          message: 'Get shipping methods successfully',
          data: mockShippingMethods,
        },
      };
    }
  },

  getPaymentMethods: async () => {
    try {
      const response =
        await http.get<SuccessResponseApi<PaymentMethod[]>>('/orders/payment/methods');
      return response;
    } catch (error) {
      console.warn('Payment API not available, using mock data');
      return {
        data: {
          message: 'Get payment methods successfully',
          data: mockPaymentMethods,
        },
      };
    }
  },

  calculateSummary: async (body: {
    purchaseIds: string[];
    shippingMethodId?: string;
    voucherCode?: string;
    coinsUsed?: number;
  }) => {
    try {
      const response = await http.post<SuccessResponseApi<CheckoutSummary>>('/checkout/summary', {
        purchase_ids: body.purchaseIds,
        shipping_method_id: body.shippingMethodId,
        voucher_code: body.voucherCode,
        coins_used: body.coinsUsed,
      });
      return response;
    } catch (error) {
      const shippingMethod =
        mockShippingMethods.find((m) => m._id === body.shippingMethodId) || mockShippingMethods[0];
      return {
        data: {
          message: 'Calculate successfully',
          data: {
            items: [],
            subtotal: 0,
            shippingFee: shippingMethod.price,
            discount: 0,
            coinsDiscount: body.coinsUsed || 0,
            total: shippingMethod.price,
          },
        },
      };
    }
  },

  createOrder: async (body: CreateOrderBody) => {
    try {
      const response = await http.post<SuccessResponseApi<Order>>('/checkout/create-order', {
        purchase_ids: body.purchaseIds,
        shipping_address_id: body.shippingAddressId,
        shipping_method_id: body.shippingMethodId,
        payment_method: body.paymentMethod,
        voucher_code: body.voucherCode,
        coins_used: body.coinsUsed,
        note: body.note,
      });
      return response;
    } catch (error) {
      console.warn('⚠️ [createOrder] API not available, using mock data');
      const mockOrder: Order = {
        _id: `order-${Date.now()}`,
        userId: 'mock-user-id',
        items: [],
        shippingAddress: {
          _id: '1',
          userId: 'mock-user-id',
          fullName: 'John Doe',
          phone: '0901234567',
          province: 'Ho Chi Minh',
          district: 'District 1',
          ward: 'Ben Nghe Ward',
          street: '123 Nguyen Hue',
          isDefault: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        shippingMethod: mockShippingMethods[0],
        paymentMethod: body.paymentMethod,
        subtotal: 0,
        shippingFee: mockShippingMethods[0].price,
        discount: 0,
        coinsUsed: body.coinsUsed || 0,
        coinsDiscount: body.coinsUsed || 0,
        total: mockShippingMethods[0].price,
        status: 'pending',
        note: body.note,
        voucherCode: body.voucherCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        data: {
          message: 'Create order successfully (mock)',
          data: mockOrder,
        },
      };
    }
  },
};

export default checkoutApi;
