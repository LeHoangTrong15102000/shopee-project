require('dotenv').config()
import mongoose from 'mongoose'

const dbURL = `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@cluster0.qygxawy.mongodb.net/main?retryWrites=true&w=majority`

const CategorySchema = new mongoose.Schema({
  name: String,
})

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 160 },
    image: { type: String, required: true, maxlength: 1000 },
    images: [{ type: String, maxlength: 1000 }],
    description: { type: String },
    category: { type: mongoose.SchemaTypes.ObjectId, ref: 'categories' },
    price: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    price_before_discount: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    view: { type: Number, default: 0 },
    location: { type: String, maxlength: 50 },
  },
  {
    timestamps: true,
  },
)

const Category = mongoose.model('categories', CategorySchema)
const Product = mongoose.model('products', ProductSchema)

async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(dbURL)
    console.log('✅ Connected to MongoDB')

    // Count documents
    const categoryCount = await Category.countDocuments()
    const productCount = await Product.countDocuments()

    console.log('\n📊 DATABASE STATUS:')
    console.log(`📦 Categories: ${categoryCount}`)
    console.log(`🛍️ Products: ${productCount}`)

    // Show all categories
    console.log('\n📋 CATEGORIES:')
    const categories = await Category.find({}, 'name')
    categories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name}`)
    })

    // Show products with locations
    console.log('\n🌍 PRODUCTS WITH LOCATIONS (Sample 10):')
    const productsWithLocation = await Product.find({}, 'name location category')
      .limit(10)
      .populate('category', 'name')

    productsWithLocation.forEach((product, index) => {
      console.log(
        `  ${index + 1}. ${product.name} - Location: ${
          product.location
        } - Category: ${(product.category as any)?.name}`,
      )
    })

    // Count products by location
    console.log('\n📍 PRODUCTS BY LOCATION:')
    const locationStats = await Product.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ])

    locationStats.forEach((stat) => {
      console.log(`  ${stat._id}: ${stat.count} products`)
    })

    console.log('\n🎉 Database check completed!')
  } catch (error) {
    console.error('💥 Error:', error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Connection closed')
    process.exit(0)
  }
}

main()
