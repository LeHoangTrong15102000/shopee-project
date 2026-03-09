/**
 * Simple Dependency Injection Container
 * Wires up repositories and services for clean architecture
 */

// Repositories
import { ProductRepository } from '@repositories/product.repository'
import { UserRepository } from '@repositories/user.repository'
import { AuthRepository } from '@repositories/auth.repository'
import { PurchaseRepository } from '@repositories/purchase.repository'
import { CategoryRepository } from '@repositories/category.repository'
import { WishlistRepository } from '@repositories/wishlist.repository'
import { NotificationRepository } from '@repositories/notification.repository'
import { AddressRepository } from '@repositories/address.repository'
import { LoyaltyRepository } from '@repositories/loyalty.repository'
import { QARepository } from '@repositories/qa.repository'
import { ConversationRepository } from '@repositories/conversation.repository'
import { ReviewRepository } from '@repositories/review.repository'
import { OrderRepository } from '@repositories/order.repository'
import { VoucherRepository } from '@repositories/voucher.repository'
import { SKURepository } from '@repositories/sku.repository'
import { ProductSkuSnapshotRepository } from '@repositories/product-sku-snapshot.repository'

// Services
import { ProductService } from '@services/product.service'
import { UserService } from '@services/user.service'
import { AuthService } from '@services/auth.service'
import { PurchaseService } from '@services/purchase.service'
import { CategoryService } from '@services/category.service'
import { WishlistService } from '@services/wishlist.service'
import { NotificationService } from '@services/notification.service'
import { AddressService } from '@services/address.service'
import { LoyaltyService } from '@services/loyalty.service'
import { QAService } from '@services/qa.service'
import { ConversationService } from '@services/conversation.service'
import { ReviewService } from '@services/review.service'
import { OrderService } from '@services/order.service'
import { VoucherService } from '@services/voucher.service'
import { CheckInService } from '@services/checkin.service'
import { PasswordResetService } from '@services/password-reset.service'
import { PriceService } from '@services/price.service'

// Repository instances (singletons)
const productRepository = new ProductRepository()
const userRepository = new UserRepository()
const authRepository = new AuthRepository()
const purchaseRepository = new PurchaseRepository()
const categoryRepository = new CategoryRepository()
const wishlistRepository = new WishlistRepository()
const notificationRepository = new NotificationRepository()
const addressRepository = new AddressRepository()
const loyaltyRepository = new LoyaltyRepository()
const qaRepository = new QARepository()
const conversationRepository = new ConversationRepository()
const reviewRepository = new ReviewRepository()
const orderRepository = new OrderRepository()
const voucherRepository = new VoucherRepository()
const skuRepository = new SKURepository()
const productSkuSnapshotRepository = new ProductSkuSnapshotRepository()

// Service instances (singletons with injected repositories)
const productService = new ProductService(productRepository, skuRepository)
const userService = new UserService(userRepository)
const authService = new AuthService(authRepository, userRepository)
const purchaseService = new PurchaseService(purchaseRepository, productRepository, skuRepository)
const categoryService = new CategoryService(categoryRepository)
const wishlistService = new WishlistService(wishlistRepository)
const notificationService = new NotificationService(notificationRepository)
const addressService = new AddressService(addressRepository)
const loyaltyService = new LoyaltyService(loyaltyRepository)
const qaService = new QAService(qaRepository, productRepository, userRepository)
const conversationService = new ConversationService(conversationRepository)
const reviewService = new ReviewService(reviewRepository, purchaseRepository, productRepository)
const orderService = new OrderService(orderRepository, productRepository, addressRepository, purchaseRepository, skuRepository, productSkuSnapshotRepository)
const voucherService = new VoucherService(voucherRepository)
const checkinService = new CheckInService()
const passwordResetService = new PasswordResetService(userRepository, authRepository)
const priceService = new PriceService()

// Export container with all services
export const container = {
  // Repositories (for direct access if needed)
  repositories: {
    product: productRepository,
    user: userRepository,
    auth: authRepository,
    purchase: purchaseRepository,
    category: categoryRepository,
    wishlist: wishlistRepository,
    notification: notificationRepository,
    address: addressRepository,
    loyalty: loyaltyRepository,
    qa: qaRepository,
    conversation: conversationRepository,
    review: reviewRepository,
    order: orderRepository,
    voucher: voucherRepository,
    sku: skuRepository,
    productSkuSnapshot: productSkuSnapshotRepository,
  },
  // Services (main interface for controllers)
  services: {
    product: productService,
    user: userService,
    auth: authService,
    purchase: purchaseService,
    category: categoryService,
    wishlist: wishlistService,
    notification: notificationService,
    address: addressService,
    loyalty: loyaltyService,
    qa: qaService,
    conversation: conversationService,
    review: reviewService,
    order: orderService,
    voucher: voucherService,
    checkin: checkinService,
    passwordReset: passwordResetService,
    price: priceService,
  },
}

// Named exports for convenience
export {
  productService,
  userService,
  authService,
  purchaseService,
  categoryService,
  wishlistService,
  notificationService,
  addressService,
  loyaltyService,
  qaService,
  conversationService,
  reviewService,
  orderService,
  voucherService,
  checkinService,
  passwordResetService,
  priceService,
  skuRepository,
  productSkuSnapshotRepository,
}

