import mongoose, { Schema } from 'mongoose'

const CategorySchema = new Schema({
  name: String
})

// Index for searching and filtering categories by name
CategorySchema.index({ name: 1 })

export const CategoryModel = mongoose.model('categories', CategorySchema)
