const fs = require('fs')
const { MongoClient, ObjectId } = require('mongodb')

// Connection string mặc định cho MongoDB local
const MONGO_URL = 'mongodb://localhost:27017/ecommerce-api'

async function importToMongoDB() {
  const client = new MongoClient(MONGO_URL)

  try {
    await client.connect()
    console.log('✅ Đã kết nối MongoDB thành công!')

    const db = client.db()
    const collection = db.collection('products')

    // Đọc dữ liệu từ file JSON
    const productsData = fs.readFileSync('../main.products.json', 'utf8')
    const products = JSON.parse(productsData)

    console.log(`📦 Tìm thấy ${products.length} sản phẩm trong file JSON`)

    // Xóa tất cả sản phẩm cũ
    const deleteResult = await collection.deleteMany({})
    console.log(`🗑️  Đã xóa ${deleteResult.deletedCount} sản phẩm cũ`)

    // Chuyển đổi ObjectId và Date format
    const transformedProducts = products.map((product) => ({
      ...product,
      _id: new ObjectId(product._id.$oid),
      category: new ObjectId(product.category.$oid),
      createdAt: new Date(product.createdAt.$date),
      updatedAt: new Date(product.updatedAt.$date),
    }))

    // Insert tất cả sản phẩm mới
    const result = await collection.insertMany(transformedProducts)
    console.log(
      `✅ Đã import thành công ${result.insertedCount} sản phẩm vào MongoDB!`
    )

    // Hiển thị thống kê
    const productsWithLocation = await collection.countDocuments({
      location: { $exists: true },
    })
    console.log(`📍 Số sản phẩm có location: ${productsWithLocation}`)

    // Hiển thị phân bố location
    const locationStats = await collection
      .aggregate([
        { $match: { location: { $exists: true } } },
        { $group: { _id: '$location', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray()

    console.log('\n📊 Phân bố sản phẩm theo địa điểm:')
    locationStats.forEach((stat) => {
      console.log(`   ${stat._id}: ${stat.count} sản phẩm`)
    })

    return result.insertedCount
  } catch (error) {
    console.error('❌ Lỗi khi import vào MongoDB:', error)
    throw error
  } finally {
    await client.close()
    console.log('🔐 Đã đóng kết nối MongoDB')
  }
}

// Chạy script
async function main() {
  try {
    console.log('=== 🚀 BẮT ĐẦU IMPORT VÀO MONGODB ===\n')

    const importCount = await importToMongoDB()

    console.log('\n=== ✅ HOÀN THÀNH ===')
    console.log(`🎉 Đã import thành công ${importCount} sản phẩm vào MongoDB!`)
  } catch (error) {
    console.error('❌ Lỗi trong quá trình thực thi:', error)

    if (error.code === 'ECONNREFUSED') {
      console.log(
        '\n💡 Gợi ý: Hãy chắc chắn rằng MongoDB đang chạy trên localhost:27017'
      )
      console.log(
        '   Hoặc cập nhật connection string trong file này nếu MongoDB chạy ở địa chỉ khác'
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
