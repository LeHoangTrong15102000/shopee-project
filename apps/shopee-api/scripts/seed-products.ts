require('dotenv').config()
import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'

// --- Product schema (self-contained, mirrors product.model.ts field set) ---
const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, maxlength: 160 },
    image: { type: String, required: true, maxlength: 1000 },
    images: [{ type: String, maxlength: 1000 }],
    description: { type: String },
    category: { type: mongoose.SchemaTypes.ObjectId, ref: 'categories' },
    shop_id: { type: mongoose.SchemaTypes.ObjectId, ref: 'shops' },
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
  { strict: false, timestamps: false },
)

const Product = mongoose.model('products', ProductSchema)

// --- Parse MongoDB extended JSON ---

interface RawExtendedOid {
  $oid: string
}

interface RawExtendedDate {
  $date: string
}

type RawValue =
  | string
  | number
  | boolean
  | null
  | RawExtendedOid
  | RawExtendedDate
  | RawValue[]
  | RawObject

interface RawObject {
  [key: string]: RawValue
}

function isOid(val: unknown): val is RawExtendedOid {
  return (
    typeof val === 'object' &&
    val !== null &&
    '$oid' in val &&
    typeof (val as RawExtendedOid).$oid === 'string'
  )
}

function isDate(val: unknown): val is RawExtendedDate {
  return (
    typeof val === 'object' &&
    val !== null &&
    '$date' in val &&
    typeof (val as RawExtendedDate).$date === 'string'
  )
}

function parseExtendedJson(val: unknown): unknown {
  if (isOid(val)) {
    return new mongoose.Types.ObjectId(val.$oid)
  }
  if (isDate(val)) {
    return new Date(val.$date)
  }
  if (Array.isArray(val)) {
    return val.map(parseExtendedJson)
  }
  if (typeof val === 'object' && val !== null) {
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      result[k] = parseExtendedJson(v)
    }
    return result
  }
  return val
}

// --- Main seed function ---

async function main() {
  const dbURL =
    process.env.MONGO_URI ??
    `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@cluster0.qygxawy.mongodb.net/main?retryWrites=true&w=majority`

  try {
    console.log('Connecting to MongoDB Atlas...')
    await mongoose.connect(dbURL)
    console.log('Connected to MongoDB Atlas\n')

    const jsonPath = path.resolve(__dirname, '../main.products.json')
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf-8')) as unknown[]

    let inserted = 0
    let skipped = 0

    for (const entry of raw) {
      const doc = parseExtendedJson(entry) as Record<string, unknown>
      const id = doc._id as mongoose.Types.ObjectId

      const existing = await Product.findById(id)
      if (existing) {
        console.log(`[SKIP] _id: ${id} already exists`)
        skipped++
        continue
      }

      await Product.create(doc)
      console.log(`[CREATED] _id: ${id}`)
      inserted++
    }

    console.log(`\n--- Seed complete ---`)
    console.log(`Inserted: ${inserted}`)
    console.log(`Skipped:  ${skipped}`)
    console.log(`Total:    ${inserted + skipped}`)
  } catch (error) {
    console.error('Error during seed:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('Connection closed')
  }
}

main()
