/**
 * Sets required environment variables for tests.
 * Must run before module imports (use setupFiles, not setupFilesAfterEnv).
 *
 * MomoProvider constructor throws if MOMO_* env vars are absent,
 * and container.ts instantiates it at module load time.
 */

// MoMo payment provider
process.env.MOMO_PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'TEST_PARTNER'
process.env.MOMO_ACCESS_KEY = process.env.MOMO_ACCESS_KEY || 'TEST_ACCESS_KEY'
process.env.MOMO_SECRET_KEY = process.env.MOMO_SECRET_KEY || 'TEST_SECRET_KEY_32_CHARS_LONG!!'

// Stripe (needed for env schema validation)
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_fake_key_for_testing'
process.env.STRIPE_PUBLISHABLE_KEY =
  process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_fake_key_for_testing'
process.env.STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_fake_key_for_testing'

// 2FA
process.env.TWO_FACTOR_ENCRYPTION_KEY =
  process.env.TWO_FACTOR_ENCRYPTION_KEY || 'test-2fa-encryption-key-32chars!'

// JWT (if not already set)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests'
