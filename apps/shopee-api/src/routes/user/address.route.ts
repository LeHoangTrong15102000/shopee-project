import { Router } from 'express'
import authMiddleware from '@middleware/auth.middleware'
import * as addressController from '@controllers/address.controller'
import { asyncHandler } from '@utils/async-handler'

export const userAddressRouter = Router()

// Get all addresses
userAddressRouter.get(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(addressController.getAddresses)
)

// Get address by ID
userAddressRouter.get(
  '/:id',
  authMiddleware.verifyAccessToken,
  asyncHandler(addressController.getAddressById)
)

// Create new address
userAddressRouter.post(
  '',
  authMiddleware.verifyAccessToken,
  asyncHandler(addressController.createAddress)
)

// Update address
userAddressRouter.put(
  '/:id',
  authMiddleware.verifyAccessToken,
  asyncHandler(addressController.updateAddress)
)

// Delete address
userAddressRouter.delete(
  '/:id',
  authMiddleware.verifyAccessToken,
  asyncHandler(addressController.deleteAddress)
)

// Set default address
userAddressRouter.put(
  '/:id/default',
  authMiddleware.verifyAccessToken,
  asyncHandler(addressController.setDefaultAddress)
)

