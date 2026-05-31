/**
 * Seed script for built-in feature flags.
 *
 * Idempotent: uses upsert-by-key so it is safe to run multiple times.
 * Each flag is upserted individually — existing flags are NOT overwritten
 * (only inserted if missing).
 *
 * Run via: ts-node src/database/migrations/seed-feature-flags.ts
 */
import mongoose from 'mongoose'
import { FeatureFlagModel } from '@database/models/feature-flag.model'

const BUILT_IN_FLAGS = [
  {
    key: 'maintenance-mode',
    name: 'Maintenance Mode',
    description: 'Puts the storefront into maintenance mode, blocking all public access.',
    enabled: false,
    rolloutPercentage: 100,
  },
  {
    key: 'new-search',
    name: 'New Search (Meilisearch)',
    description: 'Enables the Meilisearch-powered search experience instead of MongoDB text search.',
    enabled: false,
    rolloutPercentage: 100,
  },
  {
    key: 'bundle-deals',
    name: 'Bundle Deals',
    description: 'Enables the product bundle deals feature on the storefront.',
    enabled: false,
    rolloutPercentage: 100,
  },
  {
    key: 'referral-program',
    name: 'Referral Program',
    description: 'Enables the user referral program with reward tracking.',
    enabled: false,
    rolloutPercentage: 100,
  },
]

export async function seedFeatureFlags(): Promise<void> {
  let upserted = 0
  let skipped = 0

  for (const flag of BUILT_IN_FLAGS) {
    const existing = await FeatureFlagModel.findOne({ key: flag.key })
    if (existing) {
      console.log(`Feature flag '${flag.key}' already exists. Skipping.`)
      skipped++
      continue
    }

    await FeatureFlagModel.findOneAndUpdate(
      { key: flag.key },
      { $setOnInsert: flag },
      { upsert: true, new: true },
    )
    console.log(`Upserted feature flag '${flag.key}'.`)
    upserted++
  }

  console.log(`Feature flags seed complete: ${upserted} upserted, ${skipped} skipped.`)
}

// Allow running directly
if (require.main === module) {
  const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopee'
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      await seedFeatureFlags()
      await mongoose.disconnect()
    })
    .catch((err) => {
      console.error('Seed failed:', err)
      process.exit(1)
    })
}
