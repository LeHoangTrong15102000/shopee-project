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
import { PaymentRepository } from '@repositories/payment.repository'
import { SessionRepository } from '@repositories/session.repository'
import { LoginHistoryRepository } from '@repositories/login-history.repository'
import { AuditLogRepository } from '@repositories/audit-log.repository'
import { FlashSaleRepository } from '@repositories/flash-sale.repository'
import { RefundRepository } from '@repositories/refund.repository'
import { DeviceTokenRepository } from '@repositories/device-token.repository'

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
import { StripeService } from '@services/stripe.service'
import { PaymentService } from '@services/payment.service'
import { MomoProvider } from '@services/payment/momo.provider'
import { VnpayProvider } from '@services/payment/vnpay.provider'
import { IPaymentProvider, PaymentProvider } from '@services/payment/payment.interface'
import { TotpService } from '@services/totp.service'
import { SessionService } from '@services/session.service'
import { LoginHistoryService } from '@services/login-history.service'
import { AuditLogService } from '@services/audit-log.service'
import { FlashSaleService } from '@services/flash-sale.service'
import { RefundService } from '@services/refund.service'
import { DeviceTokenService } from '@services/device-token.service'
import { FcmService } from '@services/fcm.service'
import { MeilisearchService } from '@services/meilisearch.service'
import { RecommendationService } from '@services/recommendation.service'

// Jobs (now register BullMQ repeatable jobs)
import { PaymentReconciliationJob } from './jobs/payment-reconciliation.job'
import { RefundStatusPollJob } from './jobs/refund-status-poll.job'
import { FlashSaleScheduler } from './services/flash-sale.scheduler'

// Event bus
import { EventBus } from './events/event-bus'
import { registerEventHandlers } from './events/on-event.decorator'

// Event listeners
import {
  OrderEventListener,
  ProductEventListener,
  UserEventListener,
  FlashSaleEventListener,
} from './events/listeners'

// Workers
import {
  EmailWorker,
  NotificationWorker,
  SearchSyncWorker,
  CleanupWorker,
  FlashSaleSchedulerWorker,
  PaymentReconciliationWorker,
  RefundStatusPollWorker,
} from './workers'

// Queues
import {
  emailQueue,
  notificationQueue,
  searchSyncQueue,
  cleanupQueue,
  flashSaleSchedulerQueue,
  paymentReconciliationQueue,
  refundStatusPollQueue,
} from './queues'

// ─── Repository instances (singletons) ───────────────────────────────────────

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
const skuRepository = new SKURepository(productRepository)
const productSkuSnapshotRepository = new ProductSkuSnapshotRepository()
const paymentRepository = new PaymentRepository()
const sessionRepository = new SessionRepository()
const loginHistoryRepository = new LoginHistoryRepository()
const auditLogRepository = new AuditLogRepository()
const flashSaleRepository = new FlashSaleRepository()
const refundRepository = new RefundRepository()
const deviceTokenRepository = new DeviceTokenRepository()

// ─── Service instances (singletons with injected repositories) ───────────────

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
const orderService = new OrderService(
  orderRepository,
  productRepository,
  addressRepository,
  purchaseRepository,
  skuRepository,
  productSkuSnapshotRepository,
)
const voucherService = new VoucherService(voucherRepository)
const checkinService = new CheckInService()
const passwordResetService = new PasswordResetService(userRepository, authRepository)
const priceService = new PriceService()
const stripeService = new StripeService()
const momoProvider = new MomoProvider()
const vnpayProvider = new VnpayProvider()
const paymentProviders = new Map<PaymentProvider, IPaymentProvider>([
  [PaymentProvider.MOMO, momoProvider],
  [PaymentProvider.VNPAY, vnpayProvider],
])
const paymentService = new PaymentService(paymentRepository, paymentProviders, () => orderService)
const totpService = new TotpService()
const sessionService = new SessionService(sessionRepository)
const loginHistoryService = new LoginHistoryService(loginHistoryRepository)
const auditLogService = new AuditLogService(auditLogRepository)
const flashSaleService = new FlashSaleService(flashSaleRepository)
const refundService = new RefundService(
  refundRepository,
  orderRepository,
  notificationService,
  stripeService,
  paymentService,
)
const deviceTokenService = new DeviceTokenService(deviceTokenRepository)
const fcmService = new FcmService(deviceTokenRepository)
const meilisearchService = new MeilisearchService()
const recommendationService = new RecommendationService()

// ─── Event bus singleton ──────────────────────────────────────────────────────

const eventBus = new EventBus()

// ─── Event listeners (register handlers with event bus) ──────────────────────

const orderEventListener = new OrderEventListener(emailQueue, notificationQueue, recommendationService)
const productEventListener = new ProductEventListener(searchSyncQueue)
const userEventListener = new UserEventListener(emailQueue)
const flashSaleEventListener = new FlashSaleEventListener(notificationQueue)

registerEventHandlers(orderEventListener, eventBus)
registerEventHandlers(productEventListener, eventBus)
registerEventHandlers(userEventListener, eventBus)
registerEventHandlers(flashSaleEventListener, eventBus)

// ─── Wire event bus into services ────────────────────────────────────────────

authService.eventBus = eventBus
orderService.eventBus = eventBus
productService.eventBus = eventBus

// ─── Workers (auto-start on instantiation) ───────────────────────────────────

const emailWorker = new EmailWorker()
const notificationWorker = new NotificationWorker(notificationService, fcmService)
const searchSyncWorker = new SearchSyncWorker(meilisearchService)
const cleanupWorker = new CleanupWorker()
const flashSaleSchedulerWorker = new FlashSaleSchedulerWorker(eventBus)
const paymentReconciliationWorker = new PaymentReconciliationWorker(paymentService)
const refundStatusPollWorker = new RefundStatusPollWorker(
  refundRepository,
  paymentService,
  refundService,
  orderRepository,
)

// ─── Job instances (register BullMQ repeatable jobs on start()) ──────────────

const paymentReconciliationJob = new PaymentReconciliationJob(paymentReconciliationWorker)
const refundStatusPollJob = new RefundStatusPollJob()
const flashSaleScheduler = new FlashSaleScheduler()

// ─── Container export ─────────────────────────────────────────────────────────

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
    payment: paymentRepository,
    session: sessionRepository,
    loginHistory: loginHistoryRepository,
    auditLog: auditLogRepository,
    flashSale: flashSaleRepository,
    refund: refundRepository,
    deviceToken: deviceTokenRepository,
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
    stripe: stripeService,
    payment: paymentService,
    totp: totpService,
    session: sessionService,
    loginHistory: loginHistoryService,
    auditLog: auditLogService,
    flashSale: flashSaleService,
    refund: refundService,
    deviceToken: deviceTokenService,
    fcm: fcmService,
    meilisearch: meilisearchService,
    recommendation: recommendationService,
  },
  // Schedulers
  schedulers: {
    flashSale: flashSaleScheduler,
  },
  // Jobs
  jobs: {
    paymentReconciliation: paymentReconciliationJob,
    refundStatusPoll: refundStatusPollJob,
  },
  // Workers
  workers: {
    email: emailWorker,
    notification: notificationWorker,
    searchSync: searchSyncWorker,
    cleanup: cleanupWorker,
    flashSaleScheduler: flashSaleSchedulerWorker,
    paymentReconciliation: paymentReconciliationWorker,
    refundStatusPoll: refundStatusPollWorker,
  },
  // Event bus
  eventBus,
}

// ─── Named exports for convenience ───────────────────────────────────────────

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
  stripeService,
  skuRepository,
  productSkuSnapshotRepository,
  paymentRepository,
  paymentService,
  paymentReconciliationJob,
  totpService,
  sessionService,
  loginHistoryService,
  auditLogService,
  flashSaleRepository,
  flashSaleService,
  flashSaleScheduler,
  refundService,
  refundStatusPollJob,
  deviceTokenRepository,
  deviceTokenService,
  fcmService,
  meilisearchService,
  recommendationService,
  eventBus,
}
