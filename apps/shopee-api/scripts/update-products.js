const fs = require('fs')
const path = require('path')
const { ObjectId } = require('mongodb')

// Danh sách các thành phố cho location
const cities = ['Hồ Chí Minh', 'Hà Nội', 'Cần Thơ', 'Đà Nẵng']

// Hàm random location
function getRandomLocation() {
  return cities[Math.floor(Math.random() * cities.length)]
}

// Hàm random giá
function getRandomPrice(min = 30000, max = 300000) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Hàm random rating
function getRandomRating() {
  return Math.round((Math.random() * (5 - 3) + 3) * 10) / 10
}

// Hàm random số lượng
function getRandomQuantity() {
  return Math.floor(Math.random() * 10000) + 100
}

// Hàm random số lượng đã bán
function getRandomSold() {
  return Math.floor(Math.random() * 1000) + 1
}

// Hàm random view
function getRandomView() {
  return Math.floor(Math.random() * 2000) + 50
}

// Danh sách tên sản phẩm mẫu
const productNames = [
  'Áo thun nam nữ form rộng basic tee',
  'Áo polo nam cao cấp chất cotton',
  'Áo sơ mi nam tay ngắn công sở',
  'Áo khoác hoodie unisex form rộng',
  'Áo tank top nam nữ thể thao',
  'Áo vest nam slim fit công sở',
  'Áo kiểu nữ tay lỡ thời trang',
  'Áo blazer nữ công sở thanh lịch',
  'Áo crop top nữ sexy thời trang',
  'Áo dài tay nam nữ basic',
  'Quần jean nam slim fit co giãn',
  'Quần short nam nữ thể thao',
  'Quần jogger nam nữ form rộng',
  'Quần kaki nam công sở',
  'Quần legging nữ co giãn',
  'Váy midi nữ công sở thanh lịch',
  'Váy ngắn nữ thời trang trẻ trung',
  'Chân váy xòe nữ dáng A',
  'Đầm suông nữ form rộng',
  'Đầm body nữ ôm dáng',
  'Giày sneaker nam nữ thể thao',
  'Giày cao gót nữ công sở',
  'Giày lười nam da thật',
  'Dép sandal nữ thời trang',
  'Giày boot nữ cổ cao',
  'Túi xách nữ da cao cấp',
  'Balo nam nữ đi học đi làm',
  'Ví nam da thật cao cấp',
  'Thắt lưng nam da bò thật',
  'Mũ nón nam nữ thời trang',
  'Kính mát nam nữ chống UV',
  'Đồng hồ nam nữ thời trang',
  'Nhẫn bạc nữ đính đá',
  'Vòng tay nam nữ thời trang',
  'Dây chuyền nữ bạc cao cấp',
]

// Mô tả sản phẩm mẫu
const descriptions = [
  '<p>Sản phẩm chất lượng cao, thiết kế thời trang, phù hợp mọi lứa tuổi. Chất liệu cao cấp, bền đẹp, dễ bảo quản.</p>',
  '<p>Thiết kế hiện đại, trẻ trung, năng động. Dễ phối đồ, phù hợp nhiều hoàn cảnh từ đi làm đến đi chơi.</p>',
  '<p>Chất liệu cotton cao cấp, thoáng mát, thấm hút mồ hôi tốt. Form dáng chuẩn, size đa dạng từ S đến XXL.</p>',
  '<p>Sản phẩm được thiết kế theo xu hướng thời trang mới nhất. Phù hợp cho cả nam và nữ, mang lại sự thoải mái tối đa.</p>',
  '<p>Chất lượng xuất khẩu, kiểm tra kỹ càng trước khi giao hàng. Cam kết hoàn tiền nếu không hài lòng về chất lượng.</p>',
]

async function updateProductsFile() {
  try {
    // Đọc file products hiện tại
    const productsData = fs.readFileSync('../main.products.json', 'utf8')
    const products = JSON.parse(productsData)

    console.log(`Đã tìm thấy ${products.length} sản phẩm hiện tại`)

    // Thêm location cho tất cả sản phẩm hiện tại
    products.forEach((product) => {
      if (!product.location) {
        product.location = getRandomLocation()
      }
    })

    console.log('Đã thêm location cho tất cả sản phẩm hiện tại')

    // Đọc danh sách hình ảnh trong thư mục upload/product
    const uploadDir = path.join(__dirname, '..', 'upload', 'product')
    const imageFiles = fs
      .readdirSync(uploadDir)
      .filter(
        (file) =>
          file.toLowerCase().endsWith('.jpg') ||
          file.toLowerCase().endsWith('.jpeg') ||
          file.toLowerCase().endsWith('.png'),
      )

    console.log(`Tìm thấy ${imageFiles.length} hình ảnh trong thư mục upload/product`)

    // Lấy danh sách hình ảnh đã được sử dụng
    const usedImages = new Set()
    products.forEach((product) => {
      if (product.image) usedImages.add(product.image)
      if (product.images) {
        product.images.forEach((img) => usedImages.add(img))
      }
    })

    // Lọc ra các hình ảnh chưa được sử dụng
    const unusedImages = imageFiles.filter((img) => !usedImages.has(img))
    console.log(`Có ${unusedImages.length} hình ảnh chưa được sử dụng`)

    // Nếu không có hình ảnh chưa sử dụng, tạo thêm sản phẩm bằng cách sử dụng lại hình ảnh với tên khác
    let imagesToUse = unusedImages
    if (unusedImages.length === 0) {
      // Sử dụng lại 50 hình ảnh đầu tiên để tạo biến thể sản phẩm
      imagesToUse = imageFiles.slice(0, Math.min(50, imageFiles.length))
      console.log(`Sẽ tạo thêm ${imagesToUse.length} sản phẩm biến thể từ hình ảnh hiện có`)
    }

    // Tạo sản phẩm mới cho mỗi hình ảnh
    const categoryId = '60aba4e24efcc70f8892e1c6' // Category mặc định (có thể thay đổi)

    imagesToUse.forEach((imageFile, index) => {
      const price = getRandomPrice()
      const priceBeforeDiscount =
        price + Math.floor(price * 0.2) + Math.floor(Math.random() * 50000)

      const newProduct = {
        _id: {
          $oid: new ObjectId().toString(),
        },
        images: [imageFile],
        price: price,
        rating: getRandomRating(),
        price_before_discount: priceBeforeDiscount,
        quantity: getRandomQuantity(),
        sold: getRandomSold(),
        view: getRandomView(),
        name: productNames[index % productNames.length] + ` - Phiên bản ${index + 1}`,
        description: descriptions[index % descriptions.length],
        category: {
          $oid: categoryId,
        },
        image: imageFile,
        location: getRandomLocation(),
        createdAt: {
          $date: new Date().toISOString(),
        },
        updatedAt: {
          $date: new Date().toISOString(),
        },
        __v: 0,
      }

      products.push(newProduct)
    })

    console.log(`Đã tạo thêm ${imagesToUse.length} sản phẩm mới`)
    console.log(`Tổng cộng hiện có ${products.length} sản phẩm`)

    // Ghi lại file JSON
    fs.writeFileSync('../main.products.json', JSON.stringify(products, null, 2), 'utf8')
    console.log('Đã cập nhật file main.products.json thành công!')

    return {
      totalProducts: products.length,
      newProducts: imagesToUse.length,
      updatedWithLocation: products.filter((p) => p.location).length,
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật file products:', error)
    throw error
  }
}

// Hàm để import vào MongoDB
async function importToMongoDB() {
  const { MongoClient } = require('mongodb')
  require('dotenv').config()

  const client = new MongoClient(process.env.MONGO_URL)

  try {
    await client.connect()
    console.log('Đã kết nối MongoDB thành công!')

    const db = client.db()
    const collection = db.collection('products')

    // Đọc dữ liệu từ file JSON
    const productsData = fs.readFileSync('../main.products.json', 'utf8')
    const products = JSON.parse(productsData)

    // Xóa tất cả sản phẩm cũ
    await collection.deleteMany({})
    console.log('Đã xóa tất cả sản phẩm cũ')

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
    console.log(`Đã import thành công ${result.insertedCount} sản phẩm vào MongoDB!`)

    return result.insertedCount
  } catch (error) {
    console.error('Lỗi khi import vào MongoDB:', error)
    throw error
  } finally {
    await client.close()
  }
}

// Chạy script
async function main() {
  try {
    console.log('=== BẮT ĐẦU CẬP NHẬT PRODUCTS ===')

    // Cập nhật file JSON
    const updateResult = await updateProductsFile()
    console.log('\n=== KẾT QUẢ CẬP NHẬT FILE ===')
    console.log(`- Tổng số sản phẩm: ${updateResult.totalProducts}`)
    console.log(`- Sản phẩm mới được tạo: ${updateResult.newProducts}`)
    console.log(`- Sản phẩm có location: ${updateResult.updatedWithLocation}`)

    // Import vào MongoDB
    console.log('\n=== BẮT ĐẦU IMPORT VÀO MONGODB ===')
    const importCount = await importToMongoDB()
    console.log(`\n=== HOÀN THÀNH ===`)
    console.log(`Đã import thành công ${importCount} sản phẩm vào MongoDB!`)
  } catch (error) {
    console.error('Lỗi trong quá trình thực thi:', error)
    process.exit(1)
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  main()
}

module.exports = {
  updateProductsFile,
  importToMongoDB,
  main,
}
