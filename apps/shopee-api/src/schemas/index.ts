// Zod schemas barrel export
// All schemas and validation utilities are exported from this file

// Common schemas
export {
  mongoIdSchema,
  mongoIdParamSchema,
  paginationQuerySchema,
  paginationSchema,
  type PaginationQuery,
} from './common.schema'

// Auth schemas
export {
  loginSchema,
  registerSchema,
  type LoginInput,
  type RegisterInput,
} from './auth.schema'

// Category schemas
export {
  addCategorySchema,
  updateCategorySchema,
  getCategorySchema,
  categoryIdParamSchema,
  type AddCategoryInput,
  type UpdateCategoryInput,
  type GetCategoryQuery,
} from './category.schema'

// Notification schemas
export {
  getNotificationsSchema,
  markAsReadSchema,
  deleteNotificationSchema,
  type GetNotificationsQuery,
} from './notification.schema'

// Admin notification schemas
export {
  adminCreateNotificationSchema,
  adminBroadcastNotificationSchema,
  adminGetNotificationsSchema,
  adminDeleteNotificationSchema,
  type AdminCreateNotificationInput,
  type AdminBroadcastNotificationInput,
} from './admin-notification.schema'

// Wishlist schemas
export {
  getWishlistSchema,
  addToWishlistSchema,
  wishlistProductIdParamSchema,
  removeFromWishlistSchema,
  checkInWishlistSchema,
  type GetWishlistQuery,
  type AddToWishlistInput,
} from './wishlist.schema'

// Loyalty schemas
export {
  getPointsSchema,
  getTransactionsSchema,
  getRewardsSchema,
  redeemPointsSchema,
  type GetTransactionsQuery,
  type GetRewardsQuery,
} from './loyalty.schema'

// Voucher schemas
export {
  getVouchersSchema,
  getVoucherByCodeSchema,
  applyVoucherSchema,
  saveVoucherSchema,
  getSavedVouchersSchema,
  getAvailableVouchersSchema,
  getMyVouchersSchema,
  collectVoucherSchema,
  validateVoucherSchema,
  type GetVouchersQuery,
  type ApplyVoucherInput,
  type GetAvailableVouchersQuery,
  type GetMyVouchersQuery,
  type ValidateVoucherInput,
} from './voucher.schema'

// Conversation schemas
export {
  createConversationSchema,
  sendMessageSchema,
  updateConversationSchema,
  getConversationsSchema,
  testChatbotSchema,
  conversationIdParamSchema,
  type CreateConversationInput,
  type SendMessageInput,
  type UpdateConversationInput,
  type GetConversationsQuery as GetConversationsQueryType,
  type TestChatbotInput,
} from './conversation.schema'

// Review schemas
export {
  createReviewSchema,
  getProductReviewsSchema,
  reviewIdParamSchema,
  toggleReviewLikeSchema,
  createReviewCommentSchema,
  getReviewCommentsSchema,
  canReviewPurchaseSchema,
  updateReviewSchema,
  deleteReviewSchema,
  type CreateReviewInput,
  type UpdateReviewInput,
  type GetProductReviewsQuery,
  type CreateReviewCommentInput,
  type GetReviewCommentsQuery,
} from './review.schema'

// Product schemas
export {
  addProductSchema,
  updateProductSchema,
  getProductsSchema,
  getAllProductsSchema,
  getPagesSchema,
  productIdParamSchema,
  type AddProductInput,
  type UpdateProductInput,
  type GetProductsQuery,
} from './product.schema'

// Purchase schemas
export {
  addToCartSchema,
  updatePurchaseSchema,
  buyProductsSchema,
  deletePurchasesSchema,
  type AddToCartInput,
  type UpdatePurchaseInput,
  type BuyProductsInput,
  type DeletePurchasesInput,
} from './purchase.schema'

// User schemas
export {
  addUserSchema,
  updateUserSchema,
  updateMeSchema,
  userIdParamSchema,
  type AddUserInput,
  type UpdateUserInput,
  type UpdateMeInput,
} from './user.schema'

// QA schemas
export {
  getQuestionsSchema,
  askQuestionSchema,
  answerQuestionSchema,
  likeQuestionSchema,
  likeAnswerSchema,
  type GetQuestionsQuery,
  type AskQuestionInput,
  type AnswerQuestionInput,
} from './qa.schema'

// Order schemas
export {
  returnOrderSchema,
  adminUpdateStatusSchema,
  adminGetOrderSchema,
  type ReturnOrderInput,
  type AdminUpdateStatusInput,
  type AdminGetOrderInput,
} from './order.schema'

// SKU schemas
export {
  createSKUSchema,
  updateSKUSchema,
  skuIdParamSchema,
  type CreateSKUInput,
  type UpdateSKUInput,
} from './sku.schema'

// Validation middleware
export { validate, validateBadRequest } from '@middleware/zod.middleware'

// Password reset schemas
export {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from './password-reset.schema'

// Admin common schemas
export {
  PERIOD_VALUES,
  periodSchema,
  dateRangeQuerySchema,
  adminPaginationQuerySchema,
  periodDateRangeQuerySchema,
  limitQuerySchema,
  objectIdParamSchema,
  sortQuerySchema,
  searchQuerySchema,
  getDateRangeFromPeriod,
  getGroupingForPeriod,
  type PeriodValue,
  type PeriodDateRangeQuery,
} from './admin-common.schema'

// Admin dashboard schemas
export {
  dashboardOverviewSchema,
  dashboardRevenueSchema,
  dashboardRevenueByCategorySchema,
  dashboardRevenueByProductSchema,
  dashboardOrderTrendSchema,
  dashboardUserGrowthSchema,
  dashboardTopBuyersSchema,
  type DashboardRevenueQuery,
} from './admin-dashboard.schema'

// Admin order list schemas
export {
  adminOrderListSchema,
  adminBulkUpdateStatusSchema,
  type AdminOrderListQuery,
  type AdminBulkUpdateStatusBody,
} from './admin-order-list.schema'
