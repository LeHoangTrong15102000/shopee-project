import mongoose, { Schema } from 'mongoose'

const SKUSchema = new Schema(
  {
    value: { type: String, required: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, maxlength: 1000 },
    product: { type: mongoose.SchemaTypes.ObjectId, ref: 'products', required: true },
    variant_values: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
)

SKUSchema.index({ product: 1 })
SKUSchema.index({ product: 1, value: 1 }, { unique: true })
SKUSchema.index({ stock: 1 })
SKUSchema.index({ product: 1, stock: 1 })

export const SKUModel = mongoose.model('skus', SKUSchema)

