const fs = require('fs')
const mongoose = require('mongoose')
require('dotenv').config()

// Sử dụng connection string từ database config
const dbURL = `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@cluster0.qygxawy.mongodb.net/main?retryWrites=true&w=majority`

// Product Schema (đơn giản để import)
const ProductSchema = new mongoose.Schema(
  {
    images: [String],
    price: Number,
    rating: Number,
    price_before_discount: Number,
    quantity: Number,
    sold: Number,
    view: Number,
    name: String,
    description: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    image: String,
    location: String,
    createdAt: Date,
    updatedAt: Date,
    __v: Number,
  },
  {
    collection: 'products',
    versionKey: false,
  }
)

const Product = mongoose.model('Product', ProductSchema)

async function importToMongoDB() {
  try {
    // Kết nối MongoDB Atlas
    await mongoose.connect(dbURL)
    console.log('✅ Đã kết nối MongoDB Atlas thành công!')

    // Đọc dữ liệu từ file JSON
    const productsData = fs.readFileSync('../main.products.json', 'utf8')
    const products = JSON.parse(productsData)

    console.log(`📦 Tìm thấy ${products.length} sản phẩm trong file JSON`)

    // Xóa tất cả sản phẩm cũ
    const deleteResult = await Product.deleteMany({})
    console.log(`🗑️  Đã xóa ${deleteResult.deletedCount} sản phẩm cũ`)

    // Chuyển đổi format cho Mongoose
    const transformedProducts = products.map((product) => ({
      _id: new mongoose.Types.ObjectId(product._id.$oid),
      images: product.images,
      price: product.price,
      rating: product.rating,
      price_before_discount: product.price_before_discount,
      quantity: product.quantity,
      sold: product.sold,
      view: product.view,
      name: product.name,
      description: product.description,
      category: new mongoose.Types.ObjectId(product.category.$oid),
      image: product.image,
      location: product.location,
      createdAt: new Date(product.createdAt.$date),
      updatedAt: new Date(product.updatedAt.$date),
      __v: product.__v || 0,
    }))

    // Insert tất cả sản phẩm mới
    const result = await Product.insertMany(transformedProducts)
    console.log(
      `✅ Đã import thành công ${result.length} sản phẩm vào MongoDB Atlas!`
    )

    // Hiển thị thống kê
    const productsWithLocation = await Product.countDocuments({
      location: { $exists: true },
    })
    console.log(`📍 Số sản phẩm có location: ${productsWithLocation}`)

    // Hiển thị phân bố location
    const locationStats = await Product.aggregate([
      { $match: { location: { $exists: true } } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    console.log('\n📊 Phân bố sản phẩm theo địa điểm:')
    locationStats.forEach((stat) => {
      console.log(`   ${stat._id}: ${stat.count} sản phẩm`)
    })

    return result.length
  } catch (error) {
    console.error('❌ Lỗi khi import vào MongoDB Atlas:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('🔐 Đã đóng kết nối MongoDB Atlas')
  }
}

// Chạy script
async function main() {
  try {
    console.log('=== 🚀 BẮT ĐẦU IMPORT VÀO MONGODB ATLAS ===\n')

    const importCount = await importToMongoDB()

    console.log('\n=== ✅ HOÀN THÀNH ===')
    console.log(
      `🎉 Đã import thành công ${importCount} sản phẩm vào MongoDB Atlas!`
    )
  } catch (error) {
    console.error('❌ Lỗi trong quá trình thực thi:', error)

    if (error.message.includes('authentication failed')) {
      console.log(
        '\n💡 Gợi ý: Kiểm tra USERNAME_DB và PASSWORD_DB trong file .env'
      )
    } else if (error.message.includes('network')) {
      console.log(
        '\n💡 Gợi ý: Kiểm tra kết nối internet và whitelist IP trong MongoDB Atlas'
      )
    }

    process.exit(1)
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  main()
}

module.exports = {
  importToMongoDB,
  main,
}
