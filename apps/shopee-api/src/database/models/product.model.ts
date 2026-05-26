import mongoose, { Schema } from 'mongoose'

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 160 },
    image: { type: String, required: true, maxlength: 1000 },
    images: [{ type: String, maxlength: 1000 }],
    description: { type: String },
    category: { type: mongoose.SchemaTypes.ObjectId, ref: 'categories' },
    shop_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'shops', index: true },
    price: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    price_before_discount: { type: Number, default: 0 },
    quantity: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    view: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    location: { type: String, maxlength: 50 },
    variants: [
      {
        type: { type: String, maxlength: 50 },
        name: { type: String, maxlength: 100 },
        options: [
          {
            name: { type: String, maxlength: 100 },
            value: { type: String, maxlength: 100 },
            image: { type: String, maxlength: 1000 },
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Text index for full-text search on product name
ProductSchema.index({ name: 'text' })

// Single field indexes for filtering and sorting
ProductSchema.index({ category: 1 })
ProductSchema.index({ price: 1 })
ProductSchema.index({ rating: -1 })
ProductSchema.index({ sold: -1 })
ProductSchema.index({ createdAt: -1 })

// Compound index for filtering by category and sorting by price
ProductSchema.index({ category: 1, price: 1 })

export const ProductModel = mongoose.model('products', ProductSchema)
