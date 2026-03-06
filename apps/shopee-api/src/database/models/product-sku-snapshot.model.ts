import mongoose, { Schema } from 'mongoose'

const ProductSkuSnapshotSchema = new Schema(
  {
    product_name: { type: String, required: true, maxlength: 500 },
    product_image: { type: String, maxlength: 1000 },
    sku_price: { type: Number, required: true },
    sku_value: { type: String, required: true, maxlength: 500 },
    sku_image: { type: String, maxlength: 1000 },
    variant_values: { type: Schema.Types.Mixed, default: {} },
    quantity: { type: Number, required: true, min: 1 },
    sku: { type: mongoose.SchemaTypes.ObjectId, ref: 'skus', default: null },
    product: { type: mongoose.SchemaTypes.ObjectId, ref: 'products', default: null },
    order: { type: mongoose.SchemaTypes.ObjectId, ref: 'orders', default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
  }
)

ProductSkuSnapshotSchema.index({ order: 1 })
ProductSkuSnapshotSchema.index({ sku: 1 })
ProductSkuSnapshotSchema.index({ product: 1 })

export const ProductSkuSnapshotModel = mongoose.model('product_sku_snapshots', ProductSkuSnapshotSchema)

