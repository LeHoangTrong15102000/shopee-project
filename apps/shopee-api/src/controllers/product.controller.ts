import { Request, Response } from 'express'
type Req = Request<Record<string, string>>
import { responseSuccess, ErrorHandler } from '@utils/response'
import { ProductModel } from '@database/models/product.model'
import { SearchHistoryModel } from '@database/models/search-history.model'
import { STATUS } from '@constants/status'
import { FilterQuery } from 'mongoose'
import { isAdmin } from '@utils/validate'
import { uploadFile, uploadManyFile } from '@utils/upload'
import { HOST } from '@utils/helper'
import { FOLDERS, ROUTE_IMAGE } from '@constants/config'
import { omitBy } from 'lodash'
import { ORDER, SORT_BY } from '@constants/product'
import { IProduct } from '../@types/models.type'
import { ProductBody, ProductQueryParams } from '../@types/request.type'
import { emitPriceUpdate } from '../socket/utils/product-emit'
import { emitInventoryAlert } from '../socket/utils/inventory-emit'
import { SOCKET_CONFIG } from '@constants/socket'
import { productService, skuRepository } from '../container'
import { NotFoundError, ValidationError } from '@services/base.service'
import { cacheService, CacheKeys } from '@utils/cache.service'

const MAX_SEARCH_HISTORY_PER_USER = 20

export const handleImageProduct = <T extends { image?: string; images?: string[] }>(
  product: T,
): T => {
  if (product.image !== undefined && product.image !== '') {
    product.image = HOST + `/${ROUTE_IMAGE}/` + product.image
  }
  if (product.images !== undefined && product.images.length !== 0) {
    product.images = product.images.map((image: string) => {
      return image !== '' ? HOST + `/${ROUTE_IMAGE}/` + image : ''
    })
  }
  return product
}

const addProduct = async (req: Request, res: Response) => {
  const form: ProductBody = req.body
  const createData = {
    name: form.name,
    description: form.description,
    category: Array.isArray(form.category) ? form.category[0] : form.category,
    image: form.image,
    images: form.images,
    price: form.price,
    price_before_discount: form.price_before_discount ?? form.price,
    quantity: form.quantity,
    variants: form.variants,
    skus: form.skus,
  }
  const product = await productService.createProduct(createData)
  const response = {
    message: 'Tạo sản phẩm thành công',
    data: product,
  }
  return responseSuccess(res, response)
}

const getProducts = async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 30,
    category,
    exclude,
    sort_by,
    order,
    rating_filter,
    price_max,
    price_min,
    name,
  } = req.query as ProductQueryParams

  // Validate sort_by to match expected type
  const validSortBy = (SORT_BY as readonly string[]).includes(sort_by as string)
    ? (sort_by as 'price' | 'sold' | 'view' | 'createdAt')
    : 'createdAt'
  const validOrder = (ORDER as readonly string[]).includes(order as string)
    ? (order as 'asc' | 'desc')
    : 'desc'

  const result = await productService.getProducts(
    {
      category: category as string | undefined,
      exclude: exclude as string | undefined,
      rating_filter: rating_filter ? Number(rating_filter) : undefined,
      price_min: price_min ? Number(price_min) : undefined,
      price_max: price_max ? Number(price_max) : undefined,
      name: name as string | undefined,
    },
    {
      sort_by: validSortBy,
      order: validOrder,
    },
    { page: Number(page), limit: Number(limit) },
  )

  const response = {
    message: 'Lấy các sản phẩm thành công',
    data: {
      products: result.data,
      pagination: {
        page: result.pagination.page,
        limit: result.pagination.limit,
        page_size: result.pagination.page_size,
      },
    },
  }
  return responseSuccess(res, response)
}

const getAllProducts = async (req: Request, res: Response) => {
  const { category } = req.query
  const products = await productService.getAllProducts(category as string | undefined)
  const response = {
    message: 'Lấy tất cả sản phẩm thành công',
    data: products,
  }
  return responseSuccess(res, response)
}

const getProduct = async (req: Req, res: Response) => {
  try {
    const product = await productService.getProductById(req.params.product_id)
    const response = {
      message: 'Lấy sản phẩm thành công',
      data: product,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy sản phẩm')
    }
    throw error
  }
}

const updateProduct = async (req: Req, res: Response) => {
  const form: ProductBody = req.body
  const {
    name,
    description,
    category,
    image,
    rating,
    price,
    images,
    price_before_discount,
    quantity,
    sold,
    view,
    variants,
    skus,
  } = form

  // Fetch old product for comparison (price changes, inventory alerts)
  const oldProduct = await ProductModel.findById(req.params.product_id)
    .select({ price: 1, price_before_discount: 1, quantity: 1, name: 1 })
    .lean()

  try {
    const updateData = omitBy(
      {
        name,
        description,
        category,
        image,
        rating,
        price,
        images,
        price_before_discount,
        quantity,
        sold,
        view,
        variants,
        skus,
      },
      (value) => value === undefined || value === '',
    )

    const result = await productService.updateProduct(req.params.product_id, updateData)

    // Emit real-time price update if price changed
    if (oldProduct && result) {
      const priceChanged =
        oldProduct.price !== result.price ||
        oldProduct.price_before_discount !== result.price_before_discount
      if (priceChanged) {
        emitPriceUpdate(
          req.params.product_id,
          oldProduct.price,
          result.price,
          oldProduct.price_before_discount,
          result.price_before_discount,
        )
      }

      // Emit inventory alert if quantity is below threshold
      const threshold = SOCKET_CONFIG.INVENTORY.LOW_STOCK_THRESHOLD
      if (result.quantity <= threshold) {
        emitInventoryAlert(req.params.product_id, result.name, result.quantity, threshold)
      }
    }

    const response = {
      message: 'Cập nhật sản phẩm thành công',
      data: result,
    }
    return responseSuccess(res, response)
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(
        STATUS.NOT_FOUND,
        (error as Error).message || 'Không tìm thấy sản phẩm',
      )
    }
    throw error
  }
}

const deleteProduct = async (req: Req, res: Response) => {
  try {
    await productService.deleteProduct(req.params.product_id)
    return responseSuccess(res, { message: 'Xóa thành công' })
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) {
      throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy sản phẩm')
    }
    throw error
  }
}

const deleteManyProducts = async (req: Request, res: Response) => {
  const list_id = req.body.list_id as string[]
  if (!list_id || list_id.length === 0) {
    throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy sản phẩm')
  }
  const deletedCount = await productService.deleteManyProducts(list_id)
  if (deletedCount > 0) {
    return responseSuccess(res, {
      message: `Xóa ${deletedCount} sản phẩm thành công`,
      data: { deleted_count: deletedCount },
    })
  } else {
    throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy sản phẩm')
  }
}

const searchProduct = async (req: Request, res: Response) => {
  let { searchText } = req.query as { searchText: string }
  searchText = decodeURI(searchText)
  let condition: FilterQuery<IProduct> = { $text: { $search: `"${searchText}"` } }
  if (!isAdmin(req)) {
    condition = Object.assign(condition, { visible: true })
  }
  let products = (await ProductModel.find(condition)
    .populate('category')
    .sort({ createdAt: -1 })
    .select({ __v: 0, description: 0 })
    .lean()) as IProduct[]
  products = products.map((product) => handleImageProduct(product))
  const response = {
    message: 'Tìm các sản phẩm thành công',
    data: products,
  }
  return responseSuccess(res, response)
}

const uploadProductImage = async (req: Request, res: Response) => {
  const path = await uploadFile(req, FOLDERS.PRODUCT)
  const response = {
    message: 'Upload ảnh thành công',
    data: path,
  }
  return responseSuccess(res, response)
}

const uploadManyProductImages = async (req: Request, res: Response) => {
  const paths = await uploadManyFile(req, FOLDERS.PRODUCT)
  const response = {
    message: 'Upload các ảnh thành công',
    data: paths,
  }
  return responseSuccess(res, response)
}

const getSearchSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q = '' } = req.query

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      res.status(200).json({
        message: 'Lấy gợi ý tìm kiếm thành công',
        data: {
          suggestions: [],
          products: [],
        },
      })
      return
    }

    const query = q.trim().toLowerCase()

    // Tìm gợi ý từ các từ khóa phổ biến
    const commonKeywords = [
      'điện thoại',
      'điện thoại samsung',
      'điện thoại iphone',
      'điện thoại oppo',
      'laptop',
      'laptop dell',
      'laptop hp',
      'laptop asus',
      'áo thun',
      'áo thun nam',
      'áo thun nữ',
      'áo thun unisex',
      'giày',
      'giày thể thao',
      'giày nam',
      'giày nữ',
      'túi xách',
      'túi xách nữ',
      'túi xách da',
      'đồng hồ',
      'đồng hồ nam',
      'đồng hồ nữ',
      'đồng hồ thông minh',
    ]

    const suggestions = commonKeywords.filter((keyword) => keyword.includes(query)).slice(0, 8)

    // Tìm top 5 sản phẩm phù hợp
    const products = await ProductModel.find({
      name: { $regex: query, $options: 'i' },
    })
      .select('_id name image price')
      .limit(5)
      .lean()

    res.status(200).json({
      message: 'Lấy gợi ý tìm kiếm thành công',
      data: {
        suggestions,
        products,
      },
    })
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi lấy gợi ý tìm kiếm',
    })
  }
}

const getSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Nếu chưa login, trả về empty array
    if (!req.jwtDecoded?.id) {
      responseSuccess(res, {
        message: 'Lấy lịch sử tìm kiếm thành công',
        data: [],
      })
      return
    }

    const userId = req.jwtDecoded.id

    // Lấy 10 keywords gần nhất của user
    const searchHistory = await SearchHistoryModel.find({ user: userId })
      .sort({ lastSearched: -1 })
      .limit(10)
      .select('keyword')
      .lean()

    const keywords = searchHistory.map((item) => item.keyword)

    responseSuccess(res, {
      message: 'Lấy lịch sử tìm kiếm thành công',
      data: keywords,
    })
  } catch (error) {
    res.status(500).json({
      message: 'Lỗi server khi lấy lịch sử tìm kiếm',
    })
  }
}

const saveSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Yêu cầu authentication
    if (!req.jwtDecoded?.id) {
      throw new ErrorHandler(STATUS.UNAUTHORIZED, 'Vui lòng đăng nhập')
    }

    const { keyword } = req.body
    const userId = req.jwtDecoded.id

    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      res.status(400).json({
        message: 'Từ khóa không hợp lệ',
      })
      return
    }

    const trimmedKeyword = keyword.trim().toLowerCase()

    // Kiểm tra xem keyword đã tồn tại chưa
    const existingHistory = await SearchHistoryModel.findOne({
      user: userId,
      keyword: trimmedKeyword,
    })

    if (existingHistory) {
      // Nếu đã tồn tại, tăng searchCount và update lastSearched
      await SearchHistoryModel.findByIdAndUpdate(existingHistory._id, {
        $inc: { searchCount: 1 },
        lastSearched: new Date(),
      })
    } else {
      // Nếu chưa tồn tại, tạo mới
      await new SearchHistoryModel({
        user: userId,
        keyword: trimmedKeyword,
        searchCount: 1,
        lastSearched: new Date(),
      }).save()

      // Kiểm tra và xóa keyword cũ nhất nếu vượt quá giới hạn
      const totalKeywords = await SearchHistoryModel.countDocuments({ user: userId })
      if (totalKeywords > MAX_SEARCH_HISTORY_PER_USER) {
        // Tìm và xóa keyword cũ nhất
        const oldestKeyword = await SearchHistoryModel.findOne({ user: userId })
          .sort({ lastSearched: 1 })
          .lean()
        if (oldestKeyword) {
          await SearchHistoryModel.findByIdAndDelete(oldestKeyword._id)
        }
      }
    }

    responseSuccess(res, {
      message: 'Lưu lịch sử tìm kiếm thành công',
    })
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error
    }
    res.status(500).json({
      message: 'Lỗi server khi lưu lịch sử tìm kiếm',
    })
  }
}

const deleteSearchHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    // Yêu cầu authentication
    if (!req.jwtDecoded?.id) {
      throw new ErrorHandler(STATUS.UNAUTHORIZED, 'Vui lòng đăng nhập')
    }

    const userId = req.jwtDecoded.id

    // Xóa toàn bộ search history của user
    const result = await SearchHistoryModel.deleteMany({ user: userId })

    responseSuccess(res, {
      message: 'Xóa lịch sử tìm kiếm thành công',
      data: { deleted_count: result.deletedCount },
    })
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error
    }
    res.status(500).json({
      message: 'Lỗi server khi xóa lịch sử tìm kiếm',
    })
  }
}

const deleteSearchHistoryItem = async (req: Req, res: Response): Promise<void> => {
  try {
    // Yêu cầu authentication
    if (!req.jwtDecoded?.id) {
      throw new ErrorHandler(STATUS.UNAUTHORIZED, 'Vui lòng đăng nhập')
    }

    const userId = req.jwtDecoded.id
    const { keyword } = req.params

    if (!keyword) {
      res.status(400).json({
        message: 'Từ khóa không hợp lệ',
      })
      return
    }

    const decodedKeyword = decodeURIComponent(keyword).trim().toLowerCase()

    // Xóa keyword cụ thể của user
    const result = await SearchHistoryModel.findOneAndDelete({
      user: userId,
      keyword: decodedKeyword,
    })

    if (!result) {
      throw new ErrorHandler(STATUS.NOT_FOUND, 'Không tìm thấy từ khóa trong lịch sử')
    }

    responseSuccess(res, {
      message: 'Xóa từ khóa khỏi lịch sử thành công',
    })
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error
    }
    res.status(500).json({
      message: 'Lỗi server khi xóa từ khóa khỏi lịch sử',
    })
  }
}

const ProductController = {
  addProduct,
  getAllProducts,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  searchProduct,
  deleteManyProducts,
  uploadProductImage,
  uploadManyProductImages,
  getSearchSuggestions,
  getSearchHistory,
  saveSearchHistory,
  deleteSearchHistory,
  deleteSearchHistoryItem,
}

export default ProductController
