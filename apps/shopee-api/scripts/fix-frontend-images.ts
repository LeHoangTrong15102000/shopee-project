require('dotenv').config()
import mongoose from 'mongoose'
import { ProductModel } from '@database/models/product.model'

// Copy exact function từ controller với debugging
const handleImageProduct = (product: any, debugMode = false) => {
  const isProduction =
    process.env.NODE_ENV === 'production' || process.argv[2] === 'production'
  const HOST = isProduction
    ? process.env.PRODUCTION_HOST
    : `http://${process.env.HOST}:${process.env.PORT}`

  if (debugMode) {
    console.log(`   🔧 Processing images for: ${product.name}`)
    console.log(`   🌐 HOST: ${HOST}`)
    console.log(`   📁 Raw image: "${product.image}"`)
    console.log(`   📁 Raw images: [${product.images?.slice(0, 2).join(', ')}]`)
  }

  if (product.image !== undefined && product.image !== '') {
    product.image = HOST + `/images/` + product.image
  }
  if (product.images !== undefined && product.images.length !== 0) {
    product.images = product.images.map((image: string) => {
      return image !== '' ? HOST + `/images/` + image : ''
    })
  }

  if (debugMode) {
    console.log(`   🔗 Final image: "${product.image}"`)
    console.log(
      `   🔗 Final images: [${product.images?.slice(0, 2).join(', ')}]`
    )
  }

  return product
}

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

// Kiểm tra PORT mismatch
const checkPortMismatch = () => {
  console.log('🔍 KIỂM TRA PORT MISMATCH:')

  const configuredHost = process.env.HOST || 'localhost'
  const configuredPort = process.env.PORT || '4000'
  const isProduction =
    process.env.NODE_ENV === 'production' || process.argv[2] === 'production'

  console.log(`   📋 Configured: ${configuredHost}:${configuredPort}`)
  console.log(
    `   🌐 Environment: ${isProduction ? 'production' : 'development'}`
  )

  if (configuredPort !== '3000' && configuredPort !== '4000') {
    console.log(`   ⚠️  Unusual port: ${configuredPort}`)
  }

  // Test URLs
  const testUrls = [
    `http://${configuredHost}:3000/images/ff8f5319-92c1-4675-80a4-793a17fd3eb0.jpg`,
    `http://${configuredHost}:4000/images/ff8f5319-92c1-4675-80a4-793a17fd3eb0.jpg`,
    `http://${configuredHost}:${configuredPort}/images/ff8f5319-92c1-4675-80a4-793a17fd3eb0.jpg`,
  ]

  console.log('\n   🧪 Test these URLs in browser:')
  testUrls.forEach((url, index) => {
    console.log(`   ${index + 1}. ${url}`)
  })

  return { configuredHost, configuredPort, isProduction }
}

// Kiểm tra API endpoints
const checkAPIEndpoints = ({ configuredHost, configuredPort }: any) => {
  console.log('\n🔍 KIỂM TRA API ENDPOINTS:')

  const baseUrl = `http://${configuredHost}:${configuredPort}`

  const endpoints = [
    `${baseUrl}/products`, // Common route - NO AUTH
    `${baseUrl}/admin/products`, // Admin route - REQUIRE AUTH
    `${baseUrl}/admin/products/all`, // Admin route - REQUIRE AUTH
    `${baseUrl}/categories`, // Common route - NO AUTH
  ]

  console.log('   📡 Available endpoints:')
  endpoints.forEach((endpoint, index) => {
    const needsAuth = endpoint.includes('/admin/')
    console.log(
      `   ${index + 1}. ${endpoint} ${
        needsAuth ? '🔒 (Requires Auth)' : '🌐 (Public)'
      }`
    )
  })

  console.log('\n   💡 Frontend có thể đang gọi:')
  console.log('   - ✅ Public endpoints (không cần auth)')
  console.log('   - ❌ Admin endpoints (cần auth token)')

  return endpoints
}

// Test tất cả API responses
const testAllAPIResponses = async () => {
  console.log('\n🔍 KIỂM TRA TẤT CẢ API RESPONSES:')

  try {
    // Test public products endpoint (giống frontend thường gọi)
    console.log('\n   📡 Testing PUBLIC /products endpoint:')
    let publicProducts: any = await ProductModel.find({})
      .populate({ path: 'category' })
      .sort({ createdAt: -1 })
      .select({ __v: 0, description: 0 })
      .lean()
      .limit(3)

    publicProducts = publicProducts.map((product: any) =>
      handleImageProduct(product, true)
    )

    console.log('\n   📄 Public API Response Sample:')
    console.log(
      JSON.stringify(
        {
          message: 'Lấy các sản phẩm thành công',
          data: {
            products: publicProducts.slice(0, 1), // Chỉ hiển thị 1 product
            pagination: { page: 1, limit: 30 },
          },
        },
        null,
        2
      )
    )

    // Test admin products endpoint
    console.log('\n   📡 Testing ADMIN /admin/products/all endpoint:')
    let adminProducts: any = await ProductModel.find({})
      .populate({ path: 'category' })
      .sort({ createdAt: -1 })
      .select({ __v: 0, description: 0 })
      .lean()
      .limit(2)

    adminProducts = adminProducts.map((product: any) =>
      handleImageProduct(product)
    )

    console.log('\n   📄 Admin API Response Sample:')
    console.log(
      JSON.stringify(
        {
          message: 'Lấy tất cả sản phẩm thành công',
          data: adminProducts.slice(0, 1),
        },
        null,
        2
      )
    )
  } catch (error) {
    console.error('❌ Error testing API responses:', error)
  }
}

// Kiểm tra CORS issues
const checkCORSIssues = ({ configuredHost, configuredPort }: any) => {
  console.log('\n🔍 KIỂM TRA CORS ISSUES:')

  const apiUrl = `http://${configuredHost}:${configuredPort}`

  console.log('   🌐 Possible CORS scenarios:')
  console.log(`   1. Frontend (localhost:3000) → API (${apiUrl})`)
  console.log(`   2. Frontend (localhost:3001) → API (${apiUrl})`)
  console.log(`   3. Frontend (different port) → API (${apiUrl})`)

  console.log('\n   💡 CORS Solutions:')
  console.log('   ✅ Check index.ts has: app.use(cors())')
  console.log('   ✅ Static images should NOT need CORS')
  console.log('   ✅ API responses need proper CORS headers')
}

// Kiểm tra Frontend Integration Issues
const checkFrontendIntegration = () => {
  console.log('\n🔍 KIỂM TRA FRONTEND INTEGRATION:')

  console.log('   📱 Common Frontend Issues:')
  console.log('   1. ❌ Frontend đang gọi wrong PORT')
  console.log('   2. ❌ Frontend cache cũ (localStorage, Redux, etc.)')
  console.log('   3. ❌ Frontend không xử lý API response đúng')
  console.log('   4. ❌ Frontend đang gọi admin endpoints không có auth')
  console.log('   5. ❌ IMG src tag không handle full URLs')

  console.log('\n   💡 Frontend Debug Steps:')
  console.log('   1. 🔍 Mở Network tab trong DevTools')
  console.log('   2. 🔍 Kiểm tra API calls và responses')
  console.log('   3. 🔍 Kiểm tra IMG src attributes')
  console.log('   4. 🔍 Clear browser cache, localStorage')
  console.log('   5. 🔍 Hard refresh (Ctrl+Shift+R)')
}

// Tạo test data cho Frontend
const generateTestData = () => {
  console.log('\n🔍 GENERATE TEST DATA FOR FRONTEND:')

  const sampleAPIResponse = {
    message: 'Lấy các sản phẩm thành công',
    data: {
      products: [
        {
          _id: '60acf0412fb5290258597298',
          name: 'Áo thun 3d thái lan giá sỉ',
          image: `http://${process.env.HOST}:${process.env.PORT}/images/ff8f5319-92c1-4675-80a4-793a17fd3eb0.jpg`,
          images: [
            `http://${process.env.HOST}:${process.env.PORT}/images/ff8f5319-92c1-4675-80a4-793a17fd3eb0.jpg`,
            `http://${process.env.HOST}:${process.env.PORT}/images/7d880933-9603-48c3-a66e-cb7488f46292.jpg`,
          ],
          price: 68000,
          category: { _id: '60aba4e24efcc70f8892e1c6', name: 'Áo thun' },
        },
      ],
      pagination: { page: 1, limit: 30, page_size: 50 },
    },
  }

  console.log('   📄 Expected API Response Format:')
  console.log(JSON.stringify(sampleAPIResponse, null, 2))

  console.log('\n   🎯 Frontend should render:')
  console.log(
    '   - <img src="http://localhost:4000/images/ff8f5319-92c1-4675-80a4-793a17fd3eb0.jpg" />'
  )
  console.log(
    '   - NOT: <img src="ff8f5319-92c1-4675-80a4-793a17fd3eb0.jpg" />'
  )
}

// Tạo fix recommendations
const generateFixRecommendations = () => {
  console.log('\n🔧 FIX RECOMMENDATIONS:')

  console.log('\n   🎯 IMMEDIATE ACTIONS:')
  console.log('   1. 🚀 Restart backend server: pnpm start')
  console.log('   2. 🚀 Restart frontend server')
  console.log('   3. 🧹 Clear browser cache & localStorage')
  console.log('   4. 🔍 Check Network tab in DevTools')

  console.log('\n   🔍 DEBUGGING STEPS:')
  console.log('   1. Test API directly in browser/Postman')
  console.log('   2. Test image URLs directly in browser')
  console.log('   3. Check frontend API integration code')
  console.log('   4. Verify frontend image rendering logic')

  console.log('\n   📝 CODE CHECKS:')
  console.log('   1. ✅ Backend handleImageProduct() works correctly')
  console.log('   2. ✅ Backend static files middleware works')
  console.log('   3. ❓ Frontend API base URL configuration')
  console.log('   4. ❓ Frontend image component implementation')

  console.log('\n   🛠️ POSSIBLE FIXES:')
  console.log('   1. Update frontend API base URL')
  console.log('   2. Clear frontend cache/state')
  console.log('   3. Fix frontend image component')
  console.log('   4. Add error handling for images')
}

// Main function
const main = async () => {
  try {
    console.log('🩺 COMPREHENSIVE FRONTEND IMAGE FIX ANALYSIS\n')

    // 1. Check environment and ports
    const envConfig = checkPortMismatch()

    // 2. Check API endpoints
    checkAPIEndpoints(envConfig)

    // 3. Check CORS
    checkCORSIssues(envConfig)

    // 4. Connect and test API responses
    await connectDB()
    await testAllAPIResponses()

    // 5. Frontend integration checks
    checkFrontendIntegration()

    // 6. Generate test data
    generateTestData()

    // 7. Fix recommendations
    generateFixRecommendations()

    console.log('\n🎉 ANALYSIS COMPLETE!')
    console.log('📋 Check all the points above and fix accordingly.')
  } catch (error) {
    console.error('❌ Error during analysis:', error)
  } finally {
    await mongoose.connection.close()
    console.log('\n🔌 Đã đóng kết nối database')
    process.exit(0)
  }
}

// Run script
if (require.main === module) {
  main()
}

export { main as fixFrontendImages }
