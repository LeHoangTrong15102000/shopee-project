import mongoose, { Schema } from 'mongoose'

interface IAddress {
  user: mongoose.Types.ObjectId
  full_name: string
  phone: string
  province: string
  district: string
  ward: string
  street: string
  is_default: boolean
}

const AddressSchema = new Schema<IAddress>(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    full_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: true,
      maxlength: 20,
    },
    province: {
      type: String,
      required: true,
      maxlength: 100,
    },
    district: {
      type: String,
      required: true,
      maxlength: 100,
    },
    ward: {
      type: String,
      required: true,
      maxlength: 100,
    },
    street: {
      type: String,
      required: true,
      maxlength: 200,
    },
    is_default: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

AddressSchema.index({ user: 1, is_default: 1 })

export const AddressModel = mongoose.model<IAddress>('addresses', AddressSchema)

export { IAddress }
