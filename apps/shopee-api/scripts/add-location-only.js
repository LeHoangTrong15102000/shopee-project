const fs = require('fs')

// Danh sách các thành phố cho location
const cities = ['Hồ Chí Minh', 'Hà Nội', 'Cần Thơ', 'Đà Nẵng']

// Hàm random location
function getRandomLocation() {
  return cities[Math.floor(Math.random() * cities.length)]
}

async function addLocationToProducts() {
  try {
    // Đọc file products hiện tại
    console.log('📖 Đang đọc file main.products.json...')
    const productsData = fs.readFileSync('../main.products.json', 'utf8')
    const products = JSON.parse(productsData)

    console.log(`✅ Đã tìm thấy ${products.length} sản phẩm hiện tại`)

    // Đếm số sản phẩm chưa có location
    const productsWithoutLocation = products.filter(
      (product) => !product.location
    ).length
    console.log(`📍 Số sản phẩm chưa có location: ${productsWithoutLocation}`)

    // Thêm location cho tất cả sản phẩm chưa có
    let addedCount = 0
    products.forEach((product) => {
      if (!product.location) {
        product.location = getRandomLocation()
        addedCount++
      }
    })

    console.log(`✅ Đã thêm location cho ${addedCount} sản phẩm`)

    // Ghi lại file JSON
    fs.writeFileSync(
      '../main.products.json',
      JSON.stringify(products, null, 2),
      'utf8'
    )
    console.log('💾 Đã cập nhật file main.products.json thành công!')

    // Hiển thị thống kê location
    const locationStats = {}
    products.forEach((product) => {
      if (product.location) {
        locationStats[product.location] =
          (locationStats[product.location] || 0) + 1
      }
    })

    console.log('\n📊 Phân bố sản phẩm theo địa điểm:')
    Object.entries(locationStats).forEach(([location, count]) => {
      console.log(`   ${location}: ${count} sản phẩm`)
    })

    console.log(`\n✅ Tổng cộng: ${products.length} sản phẩm đã có location`)

    return {
      totalProducts: products.length,
      addedLocation: addedCount,
      locationStats: locationStats,
    }
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật file products:', error)
    throw error
  }
}

// Chạy script
async function main() {
  try {
    console.log('=== 🚀 THÊM LOCATION CHO PRODUCTS ===\n')

    const result = await addLocationToProducts()

    console.log('\n=== ✅ HOÀN THÀNH ===')
    console.log(
      `🎉 Đã cập nhật thành công! Tổng ${result.totalProducts} sản phẩm có location.`
    )
    console.log(
      '\n💡 Bây giờ bạn có thể khởi động API server và dữ liệu sẽ được tự động sync với MongoDB.'
    )
  } catch (error) {
    console.error('❌ Lỗi trong quá trình thực thi:', error)
    process.exit(1)
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  main()
}

module.exports = {
  addLocationToProducts,
  main,
}
