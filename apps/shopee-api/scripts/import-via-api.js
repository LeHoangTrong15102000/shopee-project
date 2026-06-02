const fs = require('fs')

async function importViaAPI() {
  try {
    console.log('📖 Đang đọc file main.products.json...')
    const productsData = fs.readFileSync('../main.products.json', 'utf8')
    const products = JSON.parse(productsData)

    console.log(`📦 Tìm thấy ${products.length} sản phẩm`)

    // Kiểm tra thống kê location
    const locationStats = {}
    let productsWithLocation = 0

    products.forEach((product) => {
      if (product.location) {
        productsWithLocation++
        locationStats[product.location] = (locationStats[product.location] || 0) + 1
      }
    })

    console.log(`📍 Số sản phẩm có location: ${productsWithLocation}`)
    console.log('\n📊 Phân bố sản phẩm theo địa điểm:')
    Object.entries(locationStats).forEach(([location, count]) => {
      console.log(`   ${location}: ${count} sản phẩm`)
    })

    console.log('\n✅ Dữ liệu đã sẵn sàng!')
    console.log('\n🚀 Để import vào MongoDB Atlas, bạn có thể:')
    console.log('1. Khởi động API server: npm run dev')
    console.log('2. Server sẽ tự động đọc và sync dữ liệu từ main.products.json')
    console.log('3. Hoặc tạo endpoint API để import bulk data')

    return {
      totalProducts: products.length,
      productsWithLocation: productsWithLocation,
      locationStats: locationStats,
    }
  } catch (error) {
    console.error('❌ Lỗi khi đọc file:', error)
    throw error
  }
}

// Tạo endpoint import đơn giản
function createImportEndpoint() {
  const endpointCode = `
// Thêm endpoint này vào routes/admin hoặc routes/common

router.post('/import-products', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const Product = require('../../database/models/product.model');
    
    // Đọc file JSON
    const filePath = path.join(__dirname, '../../main.products.json');
    const productsData = fs.readFileSync(filePath, 'utf8');
    const products = JSON.parse(productsData);
    
    // Xóa tất cả sản phẩm cũ
    await Product.deleteMany({});
    
    // Chuyển đổi format
    const transformedProducts = products.map(product => ({
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
      updatedAt: new Date(product.updatedAt.$date)
    }));
    
    // Import vào MongoDB
    const result = await Product.insertMany(transformedProducts);
    
    res.json({
      success: true,
      message: \`Đã import thành công \${result.length} sản phẩm\`,
      count: result.length
    });
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi import sản phẩm',
      error: error.message
    });
  }
});
`

  console.log('\n📝 Code endpoint để import (copy vào routes):')
  console.log(endpointCode)
}

// Chạy script
async function main() {
  try {
    console.log('=== 📊 KIỂM TRA DỮ LIỆU PRODUCTS ===\n')

    const result = await importViaAPI()

    console.log('\n=== 💡 HƯỚNG DẪN IMPORT VÀO MONGODB ATLAS ===')

    // Tạo file endpoint
    createImportEndpoint()

    console.log('\n=== ✅ TỔNG KẾT ===')
    console.log(`📦 Tổng sản phẩm: ${result.totalProducts}`)
    console.log(`📍 Sản phẩm có location: ${result.productsWithLocation}`)
    console.log(`🎯 Dữ liệu đã sẵn sàng để import!`)
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
  importViaAPI,
  main,
}
