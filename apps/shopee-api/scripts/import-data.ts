require('dotenv').config()
import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import { CategoryModel } from '@database/models/category.model'
import { ProductModel } from '@database/models/product.model'

// Kết nối MongoDB
const connectDB = async () => {
  try {
    const dbURL = `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@cluster0.qygxawy.mongodb.net/main?retryWrites=true&w=majority`
    await mongoose.connect(dbURL)
    console.log('✅ Kết nối MongoDB Atlas thành công!')
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error)
    process.exit(1)
  }
}

// Import categories
const importCategories = async () => {
  try {
    console.log('📦 Bắt đầu import categories...')

    // Đọc file categories
    const categoriesPath = path.join(__dirname, '../main.categories.json')
    const categoriesData = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'))

    // Xóa tất cả categories cũ
    await CategoryModel.deleteMany({})
    console.log('🗑️  Đã xóa tất cả categories cũ')

    // Chuyển đổi dữ liệu
    const categories = categoriesData.map((cat: any) => ({
      _id: new mongoose.Types.ObjectId(cat._id.$oid),
      name: cat.name,
      __v: cat.__v || 0,
    }))

    // Insert categories
    await CategoryModel.insertMany(categories)
    console.log(`✅ Đã import ${categories.length} categories thành công!`)

    return categories
  } catch (error) {
    console.error('❌ Lỗi khi import categories:', error)
    throw error
  }
}

// Import products
const importProducts = async () => {
  try {
    console.log('📦 Bắt đầu import products...')

    // Đọc file products
    const productsPath = path.join(__dirname, '../main.products.json')
    const productsData = JSON.parse(fs.readFileSync(productsPath, 'utf8'))

    // Xóa tất cả products cũ
    await ProductModel.deleteMany({})
    console.log('🗑️  Đã xóa tất cả products cũ')

    // Chuyển đổi dữ liệu
    const products = productsData.map((product: any) => ({
      _id: new mongoose.Types.ObjectId(product._id.$oid),
      name: product.name,
      image: product.image,
      images: product.images || [],
      description: product.description || '',
      category: new mongoose.Types.ObjectId(product.category.$oid),
      price: product.price || 0,
      rating: product.rating || 0,
      price_before_discount: product.price_before_discount || 0,
      quantity: product.quantity || 0,
      sold: product.sold || 0,
      view: product.view || 0,
      createdAt: new Date(product.createdAt.$date),
      updatedAt: new Date(product.updatedAt.$date),
      __v: product.__v || 0,
    }))

    // Chia nhỏ việc insert để tránh timeout
    const batchSize = 100
    let imported = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      await ProductModel.insertMany(batch)
      imported += batch.length
      console.log(`📦 Đã import ${imported}/${products.length} products...`)
    }

    console.log(`✅ Đã import tổng cộng ${products.length} products thành công!`)

    // Kiểm tra việc serve static files
    console.log('\n🔍 Kiểm tra cấu hình static files...')

    // Lấy một vài products để test URL hình ảnh
    const sampleProducts = await ProductModel.find({}).limit(3).lean()

    console.log('📊 Mẫu products với thông tin hình ảnh:')
    sampleProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name}`)
      console.log(`      - Image: ${product.image}`)
      console.log(`      - Images: ${product.images?.slice(0, 2).join(', ')}`)
    })

    return products
  } catch (error) {
    console.error('❌ Lỗi khi import products:', error)
    throw error
  }
}

// Hàm chính
const main = async () => {
  try {
    console.log('🚀 Bắt đầu quá trình import dữ liệu...')

    // Kết nối database
    await connectDB()

    // Import categories trước
    await importCategories()

    // Import products sau
    await importProducts()

    console.log('🎉 Hoàn thành import dữ liệu thành công!')

    // Hiển thị thống kê
    const categoryCount = await CategoryModel.countDocuments()
    const productCount = await ProductModel.countDocuments()

    console.log('\n📊 Thống kê dữ liệu:')
    console.log(`   - Categories: ${categoryCount}`)
    console.log(`   - Products: ${productCount}`)
  } catch (error) {
    console.error('❌ Lỗi trong quá trình import:', error)
  } finally {
    // Đóng kết nối
    await mongoose.connection.close()
    console.log('🔌 Đã đóng kết nối database')
    process.exit(0)
  }
}

// Chạy script
if (require.main === module) {
  main()
}

export { main as importData }
