require('dotenv').config()
import mongoose from 'mongoose'
import { ProductModel } from '@database/models/product.model'

// Copy exact handleImageProduct function từ controller
const handleImageProduct = (product: any) => {
  const isProduction = process.env.NODE_ENV === 'production' || process.argv[2] === 'production'
  const HOST = isProduction
    ? process.env.PRODUCTION_HOST
    : `http://${process.env.HOST}:${process.env.PORT}`

  if (product.image !== undefined && product.image !== '') {
    product.image = HOST + `/images/` + product.image
  }
  if (product.images !== undefined && product.images.length !== 0) {
    product.images = product.images.map((image: string) => {
      return image !== '' ? HOST + `/images/` + image : ''
    })
  }
  return product
}

const main = async () => {
  try {
    console.log('🔧 FINAL DEBUG - SOLVE THE FRONTEND IMAGE ISSUE\n')

    // 1. Environment Check
    console.log('📋 ENVIRONMENT CONFIGURATION:')
    console.log(`   HOST: ${process.env.HOST}`)
    console.log(`   PORT: ${process.env.PORT}`)

    const isProduction = process.env.NODE_ENV === 'production' || process.argv[2] === 'production'
    const HOST = isProduction
      ? process.env.PRODUCTION_HOST
      : `http://${process.env.HOST}:${process.env.PORT}`

    console.log(`   Final HOST URL: ${HOST}`)
    console.log(`   Is Production: ${isProduction}`)

    // 2. Connect to database
    const dbURL = `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@cluster0.qygxawy.mongodb.net/main?retryWrites=true&w=majority`
    await mongoose.connect(dbURL)
    console.log('\n✅ Kết nối MongoDB thành công!')

    // 3. Test with simple query (no populate to avoid schema error)
    console.log('\n📡 TEST API RESPONSE SIMULATION:')
    const sampleProduct: any = await ProductModel.findOne({}).lean()

    if (sampleProduct) {
      console.log('\n📦 Raw product từ database:')
      console.log(`   Name: ${sampleProduct.name}`)
      console.log(`   Raw image: "${sampleProduct.image}"`)
      console.log(`   Raw images: ["${sampleProduct.images?.slice(0, 2).join('", "')}"]`)

      // Process product với handleImageProduct
      const processedProduct = { ...sampleProduct }
      handleImageProduct(processedProduct)

      console.log('\n🔗 Processed product (sau khi xử lý):')
      console.log(`   Final image: "${processedProduct.image}"`)
      console.log(`   Final images: ["${processedProduct.images?.slice(0, 2).join('", "')}"]`)

      // Simulate complete API response
      const apiResponse = {
        message: 'Lấy các sản phẩm thành công',
        data: {
          products: [processedProduct],
          pagination: { page: 1, limit: 30, page_size: 50 },
        },
      }

      console.log('\n📄 COMPLETE API RESPONSE:')
      console.log(
        JSON.stringify(
          {
            message: apiResponse.message,
            data: {
              products: [
                {
                  _id: processedProduct._id,
                  name: processedProduct.name,
                  image: processedProduct.image,
                  images: processedProduct.images?.slice(0, 2),
                  price: processedProduct.price,
                  price_before_discount: processedProduct.price_before_discount,
                },
              ],
              pagination: apiResponse.data.pagination,
            },
          },
          null,
          2,
        ),
      )
    }

    // 4. Test URLs
    console.log('\n🧪 TEST THESE URLs IN BROWSER:')
    const sampleImage = 'ff8f5319-92c1-4675-80a4-793a17fd3eb0.jpg'
    console.log(`   1. Direct Image: ${HOST}/images/${sampleImage}`)
    console.log(`   2. API Products: ${HOST}/products`)
    console.log(`   3. API Categories: ${HOST}/categories`)

    // 5. Frontend debugging checklist
    console.log('\n🎯 FRONTEND DEBUGGING CHECKLIST:')
    console.log('   ❓ Frontend API base URL có đúng không?')
    console.log(`   ❓ Frontend có đang call: ${HOST} không?`)
    console.log('   ❓ Mở DevTools > Network tab và refresh trang')
    console.log('   ❓ Kiểm tra API calls có thành công không?')
    console.log('   ❓ Kiểm tra IMG src attributes có đúng format không?')

    // 6. Common issues và solutions
    console.log('\n🔍 COMMON ISSUES & SOLUTIONS:')
    console.log('   1. 🚨 Frontend gọi sai PORT')
    console.log(`      → Check: Frontend có gọi ${HOST} không?`)
    console.log('   2. 🚨 Frontend cache cũ')
    console.log('      → Fix: Clear cache, localStorage, hard refresh')
    console.log('   3. 🚨 CORS issues')
    console.log('      → Fix: Đã có app.use(cors()) trong index.ts')
    console.log('   4. 🚨 IMG component không handle URLs đúng')
    console.log('      → Fix: Kiểm tra React img src props')

    // 7. Immediate action steps
    console.log('\n🚀 IMMEDIATE ACTION STEPS:')
    console.log('   1. 🔄 Restart backend: pnpm start')
    console.log('   2. 🔄 Restart frontend server')
    console.log('   3. 🧹 Clear browser cache + localStorage')
    console.log('   4. 🔍 Open DevTools > Network tab')
    console.log('   5. 📡 Test API call manually:')
    console.log(`      → ${HOST}/products`)
    console.log('   6. 🖼️ Test image URL manually:')
    console.log(`      → ${HOST}/images/${sampleImage}`)
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.connection.close()
    console.log('\n🔌 Đã đóng kết nối database')
    process.exit(0)
  }
}

if (require.main === module) {
  main()
}
