import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import '@database/database'
import { CategoryModel } from '@database/models/category.model'
import { ProductModel } from '@database/models/product.model'

// Interface definitions
interface CategoryData {
  _id: { $oid: string }
  name: string
  __v: number
}

interface ProductData {
  _id: { $oid: string }
  images: string[]
  price: number
  rating: number
  price_before_discount: number
  quantity: number
  sold: number
  view: number
  name: string
  description: string
  category: { $oid: string }
  image: string
  createdAt: { $date: string }
  updatedAt: { $date: string }
  __v: number
  location?: string
}

// Function to clear existing data
async function clearExistingData() {
  console.log('🗑️ Clearing existing data...')
  await CategoryModel.deleteMany({})
  await ProductModel.deleteMany({})
  console.log('✅ Existing data cleared')
}

// Function to import categories
async function importCategories() {
  console.log('📦 Starting categories import...')

  const categoriesPath = path.join(__dirname, '..', 'main.categories.json')
  const categoriesData: CategoryData[] = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'))

  console.log(`Found ${categoriesData.length} categories to import`)

  for (const categoryData of categoriesData) {
    try {
      const category = new CategoryModel({
        _id: new mongoose.Types.ObjectId(categoryData._id.$oid),
        name: categoryData.name,
      })

      await category.save()
      console.log(`✅ Imported category: ${categoryData.name}`)
    } catch (error) {
      console.error(`❌ Error importing category ${categoryData.name}:`, error)
    }
  }

  console.log('✅ Categories import completed')
}

// Function to import products
async function importProducts() {
  console.log('📦 Starting products import...')

  const productsPath = path.join(__dirname, '..', 'main.products.json')
  const productsData: ProductData[] = JSON.parse(fs.readFileSync(productsPath, 'utf8'))

  console.log(`Found ${productsData.length} products to import`)

  let successCount = 0
  let errorCount = 0

  for (const [index, productData] of productsData.entries()) {
    try {
      // Verify category exists
      const categoryExists = await CategoryModel.findById(productData.category.$oid)
      if (!categoryExists) {
        console.warn(
          `⚠️ Category ${productData.category.$oid} not found for product ${productData.name}`,
        )
        errorCount++
        continue
      }

      const product = new ProductModel({
        _id: new mongoose.Types.ObjectId(productData._id.$oid),
        images: productData.images,
        price: productData.price,
        rating: productData.rating,
        price_before_discount: productData.price_before_discount,
        quantity: productData.quantity,
        sold: productData.sold,
        view: productData.view,
        name: productData.name,
        description: productData.description,
        category: new mongoose.Types.ObjectId(productData.category.$oid),
        image: productData.image,
        createdAt: new Date(productData.createdAt.$date),
        updatedAt: new Date(productData.updatedAt.$date),
        location: productData.location || 'Hồ Chí Minh', // Default location if not provided
      })

      await product.save()
      successCount++

      if ((index + 1) % 50 === 0) {
        console.log(`📊 Progress: ${index + 1}/${productsData.length} products processed`)
      }
    } catch (error) {
      console.error(`❌ Error importing product ${productData.name}:`, error)
      errorCount++
    }
  }

  console.log(`✅ Products import completed`)
  console.log(`📊 Success: ${successCount}, Errors: ${errorCount}`)
}

// Function to verify import
async function verifyImport() {
  console.log('🔍 Verifying import...')

  const categoryCount = await CategoryModel.countDocuments()
  const productCount = await ProductModel.countDocuments()

  console.log(`📊 Categories in database: ${categoryCount}`)
  console.log(`📊 Products in database: ${productCount}`)

  // Show sample products with locations
  const sampleProducts = await ProductModel.find({}, 'name location category')
    .limit(5)
    .populate('category', 'name')
  console.log('\n📋 Sample products:')
  sampleProducts.forEach((product) => {
    console.log(
      `  • ${product.name} - Location: ${product.location} - Category: ${
        (product.category as any)?.name
      }`,
    )
  })
}

// Main function
async function main() {
  try {
    console.log('🚀 Starting complete import process...')

    // Wait for database connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve(void 0)
      } else {
        mongoose.connection.once('open', resolve)
      }
    })

    console.log('✅ Database connected')

    // Clear existing data
    await clearExistingData()

    // Import categories first
    await importCategories()

    // Import products
    await importProducts()

    // Verify import
    await verifyImport()

    console.log('🎉 Complete import process finished successfully!')
  } catch (error) {
    console.error('💥 Error during import:', error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
    process.exit(0)
  }
}

// Run the script
if (require.main === module) {
  main()
}

export { main as importComplete }
