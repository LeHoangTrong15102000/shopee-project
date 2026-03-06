import { Router, Request, Response } from 'express'
import { ProductModel } from '@database/models/product.model'
import authMiddleware from '@middleware/auth.middleware'
import { asyncHandler } from '@utils/async-handler'
import fs from 'fs'
import path from 'path'

const adminImportRouter = Router()

// Import products từ file JSON
adminImportRouter.post(
  '/products',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Đọc file JSON
      const filePath = path.join(__dirname, '../../main.products.json')
      const productsData = fs.readFileSync(filePath, 'utf8')
      const products = JSON.parse(productsData)

      console.log(`📦 Tìm thấy ${products.length} sản phẩm trong file JSON`)

      // Xóa tất cả sản phẩm cũ
      const deleteResult = await ProductModel.deleteMany({})
      console.log(`🗑️  Đã xóa ${deleteResult.deletedCount} sản phẩm cũ`)

      // Chuyển đổi format cho Mongoose
      const transformedProducts = products.map((product: any) => ({
        _id: product._id.$oid,
        images: product.images,
        price: product.price,
        rating: product.rating,
        price_before_discount: product.price_before_discount,
        quantity: product.quantity,
        sold: product.sold,
        view: product.view,
        name: product.name,
        description: product.description,
        category: product.category.$oid,
        image: product.image,
        location: product.location, // Trường location mới
        createdAt: new Date(product.createdAt.$date),
        updatedAt: new Date(product.updatedAt.$date),
      }))

      // Import vào MongoDB
      const result = await ProductModel.insertMany(transformedProducts)
      console.log(`✅ Đã import thành công ${result.length} sản phẩm`)

      // Thống kê location
      const locationStats = await ProductModel.aggregate([
        { $match: { location: { $exists: true } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])

      res.json({
        success: true,
        message: `Đã import thành công ${result.length} sản phẩm vào MongoDB Atlas!`,
        data: {
          imported: result.length,
          deleted: deleteResult.deletedCount,
          locationStats: locationStats,
        },
      })
    } catch (error: any) {
      console.error('❌ Import error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi import sản phẩm',
        error: error.message,
      })
    }
  })
)

// Kiểm tra thống kê products
adminImportRouter.get(
  '/products/stats',
  authMiddleware.verifyAccessToken,
  authMiddleware.verifyAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const totalProducts = await ProductModel.countDocuments({})
      const productsWithLocation = await ProductModel.countDocuments({
        location: { $exists: true, $ne: null },
      })

      const locationStats = await ProductModel.aggregate([
        { $match: { location: { $exists: true, $ne: null } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])

      res.json({
        success: true,
        data: {
          totalProducts,
          productsWithLocation,
          locationStats,
        },
      })
    } catch (error: any) {
      console.error('❌ Stats error:', error)
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê',
        error: error.message,
      })
    }
  })
)

export default adminImportRouter
