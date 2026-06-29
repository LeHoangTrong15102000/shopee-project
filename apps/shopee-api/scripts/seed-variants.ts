/**
 * seed-variants.ts
 *
 * Adds product variants and generated SKUs to existing seeded products in MongoDB.
 *
 * Idempotent: products that already have a non-empty `variants` array OR already have
 * any documents in the `skus` collection are skipped safely. Re-running the script
 * will never produce duplicate SKUs (uses upsert with the unique compound index).
 *
 * How to run (from apps/shopee-api with a valid .env):
 *   npx tsx scripts/seed-variants.ts
 *   -- or --
 *   npx ts-node -r tsconfig-paths/register scripts/seed-variants.ts
 *
 * Required env vars (same as the main app):
 *   MONGO_URI          full Atlas connection string (takes precedence), OR
 *   USERNAME_DB        Atlas username
 *   PASSWORD_DB        Atlas password
 *
 * Optional env vars:
 *   SEED_VARIANT_LIMIT   max number of products to process (default: 10)
 */

require('dotenv').config()
import mongoose, { Schema, Types } from 'mongoose'

// ---------------------------------------------------------------------------
// Constants (mirrors variant.helper.ts)
// ---------------------------------------------------------------------------

const MAX_VARIANTS = 5
const MAX_OPTIONS_PER_VARIANT = 20
const MAX_SKU_COMBINATIONS = 100

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariantOption {
  name: string
  value: string
  image?: string
}

interface VariantTemplate {
  type: string
  name: string
  options: VariantOption[]
}

interface ProductDoc {
  _id: Types.ObjectId
  name: string
  price: number
  image: string
  variants: VariantTemplate[]
}

// ---------------------------------------------------------------------------
// Mongoose models (self-contained, do NOT import app models)
// ---------------------------------------------------------------------------

const ProductSchema = new Schema(
  {
    name: { type: String },
    price: { type: Number, default: 0 },
    image: { type: String },
    variants: [
      {
        type: { type: String },
        name: { type: String },
        options: [
          {
            name: { type: String },
            value: { type: String },
            image: { type: String },
          },
        ],
      },
    ],
  },
  { strict: false },
)

const Product = mongoose.model<ProductDoc>('products', ProductSchema)

const SKUSchema = new Schema(
  {
    value: { type: String, required: true, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    image: { type: String, maxlength: 1000 },
    product: { type: Schema.Types.ObjectId, ref: 'products', required: true },
    variant_values: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
)

SKUSchema.index({ product: 1 })
SKUSchema.index({ product: 1, value: 1 }, { unique: true })

const SKU = mongoose.model('skus', SKUSchema)

// ---------------------------------------------------------------------------
// Variant templates
// ---------------------------------------------------------------------------

const VARIANT_TEMPLATES: VariantTemplate[][] = [
  // Template 0 — Color + Size (9 SKUs)
  [
    {
      type: 'color',
      name: 'Màu sắc',
      options: [
        { name: 'Đỏ', value: 'red' },
        { name: 'Trắng', value: 'white' },
        { name: 'Đen', value: 'black' },
      ],
    },
    {
      type: 'size',
      name: 'Kích thước',
      options: [
        { name: 'S', value: 's' },
        { name: 'M', value: 'm' },
        { name: 'L', value: 'l' },
      ],
    },
  ],
  // Template 1 — Color only (3 SKUs)
  [
    {
      type: 'color',
      name: 'Màu sắc',
      options: [
        { name: 'Đỏ', value: 'red' },
        { name: 'Xanh', value: 'blue' },
        { name: 'Vàng', value: 'yellow' },
      ],
    },
  ],
  // Template 2 — Size only (4 SKUs)
  [
    {
      type: 'size',
      name: 'Kích thước',
      options: [
        { name: 'S', value: 's' },
        { name: 'M', value: 'm' },
        { name: 'L', value: 'l' },
        { name: 'XL', value: 'xl' },
      ],
    },
  ],
]

// ---------------------------------------------------------------------------
// SKU generation helpers (mirrors variant.helper.ts, self-contained)
// ---------------------------------------------------------------------------

/**
 * Computes the Cartesian product of multiple string arrays.
 * E.g. [["red","blue"],["s","m"]] → [["red","s"],["red","m"],["blue","s"],["blue","m"]]
 */
function cartesianProduct(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, arr) => acc.flatMap((combo) => arr.map((item) => [...combo, item])),
    [[]],
  )
}

/**
 * Returns the flat SKU value strings for a set of variants.
 * E.g. "red-s", "red-m", ...
 */
function generateSKUCombinations(variants: VariantTemplate[]): string[] {
  if (variants.length === 0) return []
  const optionArrays = variants.map((v) => v.options.map((o) => o.value))
  return cartesianProduct(optionArrays).map((combo) => combo.join('-'))
}

/**
 * Returns the variant_values map for each SKU combination.
 * E.g. { color: "red", size: "s" }
 */
function generateVariantValues(variants: VariantTemplate[]): Record<string, string>[] {
  if (variants.length === 0) return []
  const optionArrays = variants.map((v) => v.options.map((o) => o.value))
  const types = variants.map((v) => v.type.toLowerCase())
  return cartesianProduct(optionArrays).map((combo) => {
    const values: Record<string, string> = {}
    types.forEach((type, i) => {
      values[type] = combo[i]
    })
    return values
  })
}

/**
 * Resolves the image for a given SKU combination.
 * Prefers the first matched variant-option image, falls back to the product's own image.
 */
function resolveSkuImage(
  variants: VariantTemplate[],
  variantValues: Record<string, string>,
  productImage: string,
): string | undefined {
  for (const variant of variants) {
    const chosenValue = variantValues[variant.type.toLowerCase()]
    const opt = variant.options.find((o) => o.value === chosenValue)
    if (opt?.image) return opt.image
  }
  return productImage || undefined
}

// ---------------------------------------------------------------------------
// Validation guard (mirrors variant.helper.ts limits)
// ---------------------------------------------------------------------------

function assertTemplateLimits(variants: VariantTemplate[]): void {
  if (variants.length > MAX_VARIANTS) {
    throw new Error(`Template exceeds MAX_VARIANTS (${MAX_VARIANTS}): has ${variants.length}`)
  }
  for (const v of variants) {
    if (v.options.length > MAX_OPTIONS_PER_VARIANT) {
      throw new Error(
        `Variant "${v.name}" exceeds MAX_OPTIONS_PER_VARIANT (${MAX_OPTIONS_PER_VARIANT})`,
      )
    }
  }
  const totalCombinations = variants.reduce((acc, v) => acc * v.options.length, 1)
  if (totalCombinations > MAX_SKU_COMBINATIONS) {
    throw new Error(
      `Template produces ${totalCombinations} combinations, exceeds MAX_SKU_COMBINATIONS (${MAX_SKU_COMBINATIONS})`,
    )
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dbURL =
    process.env.MONGO_URI ??
    `mongodb+srv://${process.env.USERNAME_DB}:${process.env.PASSWORD_DB}@cluster0.qygxawy.mongodb.net/main?retryWrites=true&w=majority`

  const limit = process.env.SEED_VARIANT_LIMIT ? parseInt(process.env.SEED_VARIANT_LIMIT, 10) : 10

  // Validate all templates before touching the database
  for (const template of VARIANT_TEMPLATES) {
    assertTemplateLimits(template)
  }

  try {
    console.log('Connecting to MongoDB Atlas...')
    await mongoose.connect(dbURL)
    console.log('Connected to MongoDB Atlas\n')

    // Find products that currently have no variants
    const candidates = await Product.find({
      $or: [{ variants: { $exists: false } }, { variants: { $size: 0 } }],
    })
      .limit(limit)
      .lean<ProductDoc[]>()

    console.log(`Found ${candidates.length} product(s) without variants (limit: ${limit})\n`)

    let productsUpdated = 0
    let productsSkipped = 0
    let totalSkusCreated = 0

    for (let i = 0; i < candidates.length; i++) {
      const product = candidates[i]
      const productId = product._id

      // --- Idempotency check: skip if skus already exist ---
      const existingSkuCount = await SKU.countDocuments({ product: productId })
      if (existingSkuCount > 0) {
        console.log(`[SKIP] ${productId} already has ${existingSkuCount} skus`)
        productsSkipped++
        continue
      }

      // Round-robin assign a template
      const template = VARIANT_TEMPLATES[i % VARIANT_TEMPLATES.length]

      // a. Write the variants array onto the product document
      await Product.updateOne({ _id: productId }, { $set: { variants: template } })

      // b & c. Generate SKU combinations and upsert each one
      const skuValues = generateSKUCombinations(template)
      const variantValuesList = generateVariantValues(template)
      let createdCount = 0

      for (let j = 0; j < skuValues.length; j++) {
        const skuValue = skuValues[j]
        const variantValues = variantValuesList[j]
        const skuImage = resolveSkuImage(template, variantValues, product.image)

        // d. Upsert — $setOnInsert so re-runs are no-ops
        const result = await SKU.updateOne(
          { product: productId, value: skuValue },
          {
            $setOnInsert: {
              value: skuValue,
              variant_values: variantValues,
              product: productId,
              price: product.price ?? 0,
              stock: 50,
              ...(skuImage ? { image: skuImage } : {}),
            },
          },
          { upsert: true },
        )

        if (result.upsertedCount > 0) createdCount++
      }

      // e. Log per-product result
      console.log(`[CREATED] ${productId} "${product.name}" → ${createdCount} skus`)
      productsUpdated++
      totalSkusCreated += createdCount
    }

    // Summary
    console.log('\n--- Seed variants complete ---')
    console.log(`Products updated: ${productsUpdated}`)
    console.log(`Products skipped: ${productsSkipped}`)
    console.log(`Total SKUs created: ${totalSkusCreated}`)
    console.log(`Total processed: ${productsUpdated + productsSkipped}`)
  } catch (error) {
    console.error('Error during seed-variants:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('Connection closed')
  }
}

main()
