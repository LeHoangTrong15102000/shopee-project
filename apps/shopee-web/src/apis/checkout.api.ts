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
    name: 'Hỏa Tốc',
    description: 'Giao hàng siêu nhanh trong vòng 4 giờ',
    price: 112600,
    estimatedDays: '4 giờ',
    icon: 'truck',
    type: 'instant',
    deliveryHours: 4,
    details: [
      { text: 'Tặng Voucher ₫20.000 nếu đơn giao sau thời gian trên', type: 'voucher' },
      { text: 'Miễn phí vận chuyển đơn tối thiểu 0₫', type: 'free_threshold' },
      { text: 'Kênh không hỗ trợ chương trình Shopee Đồng Kiểm', type: 'note' },
    ],
  },
  {
    _id: 'bulky',
    name: 'Hàng Cồng Kềnh',
    description: 'Dành cho hàng hóa kích thước lớn',
    price: 30800,
    estimatedDays: '2-4 ngày',
    icon: 'box',
    type: 'standard',
    details: [
      { text: 'Tặng Voucher ₫15.000 nếu đơn giao sau thời gian trên', type: 'voucher' },
      { text: 'Giảm 95% đơn tối thiểu 100.000₫ (giảm tối đa 200.000₫)', type: 'discount' },
      { text: 'Miễn phí vận chuyển đơn tối thiểu 500.000₫', type: 'free_threshold' },
      { text: 'Miễn phí vận chuyển đơn tối thiểu 1.000.000₫', type: 'free_threshold' },
    ],
  },
  {
    _id: 'express',
    name: 'Nhanh',
    description: 'Giao hàng nhanh trong 1-2 ngày',
    price: 30800,
    estimatedDays: '1 ngày',
    icon: 'rocket',
    type: 'express',
    details: [
      { text: 'Tặng Voucher ₫15.000 nếu đơn giao sau thời gian trên', type: 'voucher' },
      { text: 'Miễn phí vận chuyển đơn tối thiểu 0₫', type: 'free_threshold' },
    ],
  },
  {
    _id: 'standard',
    name: 'Tiết Kiệm',
    description: 'Giao hàng tiết kiệm trong 3-5 ngày',
    price: 16500,
    estimatedDays: '3-5 ngày',
    icon: 'standard',
    type: 'economy',
    details: [
      { text: 'Tặng Voucher ₫15.000 nếu đơn giao sau thời gian trên', type: 'voucher' },
      { text: 'Miễn phí vận chuyển đơn tối thiểu 0₫', type: 'free_threshold' },
    ],
  },
  {
    _id: 'pickup',
    name: 'Tủ Nhận Hàng',
    description: 'Nhận hàng tại điểm nhận hàng',
    price: 30800,
    estimatedDays: '2-3 ngày',
    icon: 'locker',
    type: 'pickup',
    details: [{ text: 'Miễn phí vận chuyển đơn tối thiểu 0₫', type: 'free_threshold' }],
  },
];

// Mock payment methods
const mockPaymentMethods: PaymentMethod[] = [
  {
    _id: 'cod',
    type: 'cod',
    name: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi nhận hàng',
    icon: 'cod',
    isAvailable: true,
  },
  {
    _id: 'bank_transfer',
    type: 'bank_transfer',
    name: 'Chuyển khoản ngân hàng',
    description: 'Chuyển khoản qua tài khoản ngân hàng',
    icon: 'bank_transfer',
    isAvailable: true,
  },
  {
    _id: 'e_wallet',
    type: 'e_wallet',
    name: 'Ví điện tử',
    description: 'Thanh toán qua MoMo, ZaloPay, VNPay',
    icon: 'e_wallet',
    isAvailable: true,
  },
  {
    _id: 'credit_card',
    type: 'credit_card',
    name: 'Thẻ tín dụng/Ghi nợ',
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
          message: 'Lấy phương thức vận chuyển thành công',
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
          message: 'Lấy phương thức thanh toán thành công',
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
          message: 'Tính toán thành công',
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
          fullName: 'Nguyễn Văn A',
          phone: '0901234567',
          province: 'Hồ Chí Minh',
          district: 'Quận 1',
          ward: 'Phường Bến Nghé',
          street: '123 Nguyễn Huệ',
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
          message: 'Tạo đơn hàng thành công (mock)',
          data: mockOrder,
        },
      };
    }
  },
};

export default checkoutApi;
