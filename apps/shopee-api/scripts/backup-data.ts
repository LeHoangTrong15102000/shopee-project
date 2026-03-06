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

// Backup categories
const backupCategories = async (backupDir: string) => {
  try {
    console.log('💾 Đang backup categories...')

    const categories = await CategoryModel.find({}).lean()

    if (categories.length > 0) {
      const categoriesPath = path.join(backupDir, 'categories-backup.json')
      fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2))
      console.log(
        `✅ Đã backup ${categories.length} categories vào ${categoriesPath}`
      )
    } else {
      console.log('ℹ️  Không có categories để backup')
    }

    return categories.length
  } catch (error) {
    console.error('❌ Lỗi khi backup categories:', error)
    throw error
  }
}

// Backup products
const backupProducts = async (backupDir: string) => {
  try {
    console.log('💾 Đang backup products...')

    const products = await ProductModel.find({}).lean()

    if (products.length > 0) {
      const productsPath = path.join(backupDir, 'products-backup.json')
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2))
      console.log(
        `✅ Đã backup ${products.length} products vào ${productsPath}`
      )
    } else {
      console.log('ℹ️  Không có products để backup')
    }

    return products.length
  } catch (error) {
    console.error('❌ Lỗi khi backup products:', error)
    throw error
  }
}

// Tạo thư mục backup với timestamp
const createBackupDir = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const backupDir = path.join(__dirname, `../backups/backup-${timestamp}`)

  if (!fs.existsSync(path.dirname(backupDir))) {
    fs.mkdirSync(path.dirname(backupDir), { recursive: true })
  }

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  return backupDir
}

// Hàm chính
const main = async () => {
  try {
    console.log('🚀 Bắt đầu quá trình backup dữ liệu...')

    // Kết nối database
    await connectDB()

    // Tạo thư mục backup
    const backupDir = createBackupDir()
    console.log(`📁 Thư mục backup: ${backupDir}`)

    // Backup categories
    const categoryCount = await backupCategories(backupDir)

    // Backup products
    const productCount = await backupProducts(backupDir)

    // Tạo file metadata
    const metadata = {
      backupDate: new Date().toISOString(),
      totalCategories: categoryCount,
      totalProducts: productCount,
      database: 'main',
      collections: ['categories', 'products'],
    }

    const metadataPath = path.join(backupDir, 'metadata.json')
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

    console.log('🎉 Hoàn thành backup dữ liệu thành công!')
    console.log('\n📊 Thống kê backup:')
    console.log(`   - Categories: ${categoryCount}`)
    console.log(`   - Products: ${productCount}`)
    console.log(`   - Thư mục: ${backupDir}`)
  } catch (error) {
    console.error('❌ Lỗi trong quá trình backup:', error)
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

export { main as backupData }
