import mongoose, { Schema } from 'mongoose'

interface IAddress {
  user: mongoose.Types.ObjectId
  full_name: string
  phone: string
  province: string
  province_id?: string
  district: string
  district_id?: string
  ward: string
  ward_id?: string
  street: string
  is_default: boolean
  address_type?: string
  label?: string
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
    province_id: {
      type: String,
      maxlength: 50,
    },
    district: {
      type: String,
      required: true,
      maxlength: 100,
    },
    district_id: {
      type: String,
      maxlength: 50,
    },
    ward: {
      type: String,
      required: true,
      maxlength: 100,
    },
    ward_id: {
      type: String,
      maxlength: 50,
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
    address_type: {
      type: String,
      maxlength: 20,
      default: 'home',
    },
    label: {
      type: String,
      maxlength: 100,
    },
  },
  {
    timestamps: true,
  },
)

AddressSchema.index({ user: 1, is_default: 1 })

export const AddressModel = mongoose.model<IAddress>('addresses', AddressSchema)

export { IAddress }
