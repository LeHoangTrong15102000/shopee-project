require('dotenv').config()
import mongoose from 'mongoose'

const dbURL = `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@cluster0.qygxawy.mongodb.net/main?retryWrites=true&w=majority`

const CategorySchema = new mongoose.Schema({
  name: String,
})

const Category = mongoose.model('categories', CategorySchema)

async function main() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await mongoose.connect(dbURL)
    console.log('✅ Connected to MongoDB')

    // Categories for the new products based on their names
    const newCategories = [
      'Đồ gia dụng',
      'Thiết bị điện tử',
      'Đồ chơi',
      'Mỹ phẩm',
      'Thực phẩm',
      'Đồ thể thao',
      'Phụ kiện',
      'Giày dép',
      'Túi xách',
      'Nước hoa',
    ]

    console.log('📦 Adding new categories...')

    for (const categoryName of newCategories) {
      // Check if category already exists
      const existingCategory = await Category.findOne({ name: categoryName })

      if (!existingCategory) {
        const category = new Category({
          name: categoryName,
        })

        await category.save()
        console.log(`✅ Added category: ${categoryName}`)
      } else {
        console.log(`ℹ️ Category already exists: ${categoryName}`)
      }
    }

    // Show all categories
    const allCategories = await Category.find({}, 'name')
    console.log('\n📋 All categories in database:')
    allCategories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (ID: ${cat._id})`)
    })

    console.log(`\n📊 Total categories: ${allCategories.length}`)
    console.log('🎉 Categories update completed!')
  } catch (error) {
    console.error('💥 Error:', error)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Connection closed')
    process.exit(0)
  }
}

main()
