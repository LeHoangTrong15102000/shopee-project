/**
 * Environment variable validation schema
 *
 * Validates all required env vars at startup using zod.
 * The server will throw and exit with a clear error message listing
 * ALL missing or invalid vars if any fail validation.
 */
import { z, ZodError } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().int().positive().default(4000),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  SECRET_KEY_JWT: z
    .string()
    .min(
      32,
      'JWT_SECRET (SECRET_KEY_JWT) must be at least 32 characters — use a strong random value',
    ),

  // Access token TTL in seconds. Default: 900 (15 minutes).
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),

  // Refresh token TTL in seconds. Default: 2592000 (30 days).
  // Old value was 100 days (8_640_000 s) — reduced for security.
  JWT_REFRESH_TTL: z.coerce.number().int().positive().default(2_592_000),

  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required').default('http://localhost:3000'),

  UPLOAD_DIR: z.string().default('upload'),

  // Feature flag: when true, reject tokens that use the legacy payload shape
  // (no roles / no jti). Set to false on first deploy and flip after stable.
  AUTH_STRICT_MODE: z
    .string()
    .optional()
    .transform((val) => val === 'true'),

  // Redis Cloud connection URL for rate limiting, caching, etc.
  // Format: redis://default:<password>@<host>:<port>
  REDIS_URL: z
    .string()
    .url('REDIS_URL must be a valid redis:// URL')
    .startsWith('redis', 'REDIS_URL must use redis:// or rediss:// protocol')
    .optional(),

  // Redis individual connection parameters (alternative to REDIS_URL)
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().positive().optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_USERNAME: z.string().optional(),
  REDIS_TLS_ENABLED: z.coerce.boolean().default(false),

  // Rate limiting — max requests per window per key
  RATE_LIMIT_PUBLIC_MAX: z.coerce.number().int().positive().default(200),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(15),
  RATE_LIMIT_ADMIN_MAX: z.coerce.number().int().positive().default(300),
  RATE_LIMIT_EXPENSIVE_MAX: z.coerce.number().int().positive().default(30),
  // Rate limit window in seconds (shared across all presets)
  RATE_LIMIT_WINDOW_S: z.coerce.number().int().positive().default(60),
  // Comma-separated list of IPs that bypass rate limiting (e.g. load balancer, monitoring)
  RATE_LIMIT_WHITELIST_IPS: z.string().default(''),

  // Stripe — required when CREDIT_CARD payment method is active
  STRIPE_SECRET_KEY: z
    .string()
    .min(1, 'STRIPE_SECRET_KEY is required for credit card payments')
    .startsWith('sk_', 'STRIPE_SECRET_KEY must start with sk_ (use sk_test_ for development)'),

  STRIPE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'STRIPE_PUBLISHABLE_KEY is required')
    .startsWith('pk_', 'STRIPE_PUBLISHABLE_KEY must start with pk_'),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1, 'STRIPE_WEBHOOK_SECRET is required for webhook signature verification')
    .startsWith('whsec_', 'STRIPE_WEBHOOK_SECRET must start with whsec_'),

  // Two-Factor Authentication — AES-256-GCM key for encrypting TOTP secrets at rest.
  // Must be a 64-character hex string (32 bytes).
  // Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  TWO_FACTOR_ENCRYPTION_KEY: z
    .string()
    .regex(
      /^[0-9a-f]{64}$/i,
      'TWO_FACTOR_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)',
    ),

  // Flash sale scheduler check interval in seconds (default 60s)
  FLASH_SALE_CHECK_INTERVAL: z.coerce.number().int().positive().default(60),

  // Refund request deadline in days after delivery (default 7 days)
  REFUND_REQUEST_DEADLINE_DAYS: z.coerce.number().int().positive().default(7),

  // MoMo refund status polling interval in milliseconds (default 300000 = 5 minutes)
  MOMO_REFUND_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(300000),

  // Firebase Admin SDK credentials for FCM push notifications
  // Provide either the JSON string or a file path — both are optional
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),

  // Bull Board admin dashboard — set to false to disable
  BULL_BOARD_ENABLED: z.coerce.boolean().default(true),

  // Meilisearch — full-text search engine
  // MEILISEARCH_HOST — URL of the Meilisearch instance
  MEILISEARCH_HOST: z.string().url().default('http://localhost:7700'),
  // MEILISEARCH_MASTER_KEY — master key for Meilisearch authentication
  MEILISEARCH_MASTER_KEY: z
    .string()
    .min(1, 'MEILISEARCH_MASTER_KEY is required')
    .default('shopee_meili_master_key'),

  // Google OAuth 2.0 — client ID used to verify Google Sign-In ID tokens.
  // Must end with .apps.googleusercontent.com (the stable suffix for all Google OAuth client IDs).
  // Create credentials at https://console.cloud.google.com/apis/credentials
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, 'GOOGLE_CLIENT_ID is required for Google Sign-In token verification')
    .endsWith(
      '.apps.googleusercontent.com',
      'GOOGLE_CLIENT_ID must end with .apps.googleusercontent.com — check your Google Cloud credentials',
    ),

  // Google OAuth 2.0 — server-side Authorization Code flow (web).
  // GOOGLE_CLIENT_SECRET  — client secret for the server-side token exchange.
  // GOOGLE_REDIRECT_URI   — backend callback URL; must be registered on the Google OAuth client.
  // GOOGLE_CLIENT_REDIRECT_URI — web landing page URL (receives ?tmp= or ?error=).
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET is required for web OAuth flow'),

  GOOGLE_REDIRECT_URI: z
    .string()
    .url(
      'GOOGLE_REDIRECT_URI must be a valid URL (the BE callback registered on the OAuth client)',
    ),

  GOOGLE_CLIENT_REDIRECT_URI: z
    .string()
    .url(
      'GOOGLE_CLIENT_REDIRECT_URI must be a valid URL (the web landing page, e.g. /auth/callback)',
    ),
})

export type Env = z.infer<typeof envSchema>

/**
 * Parse and validate process.env.
 *
 * Throws with a message listing ALL invalid / missing vars if validation fails.
 * Call this at the very top of src/index.ts before any DB / service init.
 *
 * In NODE_ENV=test, validation is skipped and safe test defaults are returned.
 * This allows integration tests to run without a full .env file.
 */
export function validateEnv(rawEnv: NodeJS.ProcessEnv = process.env): Env {
  // In test environment: skip validation and return safe defaults.
  // Unit tests that need to test the validation itself can still import
  // validateEnv directly and pass an explicit env object.
  if (rawEnv.NODE_ENV === 'test') {
    return {
      NODE_ENV: 'test',
      PORT: 4000,
      MONGO_URI: rawEnv.MONGO_URI || 'mongodb://localhost:27017/test',
      SECRET_KEY_JWT: rawEnv.SECRET_KEY_JWT || 'test-secret-key-that-is-at-least-32-chars',
      JWT_ACCESS_TTL: 900,
      JWT_REFRESH_TTL: 2_592_000,
      CLIENT_URL: 'http://localhost:3000',
      UPLOAD_DIR: 'upload',
      AUTH_STRICT_MODE: false,
      REDIS_URL: undefined,
      REDIS_HOST: undefined,
      REDIS_PORT: undefined,
      REDIS_PASSWORD: undefined,
      REDIS_USERNAME: undefined,
      REDIS_TLS_ENABLED: false,
      RATE_LIMIT_PUBLIC_MAX: 200,
      RATE_LIMIT_AUTH_MAX: 15,
      RATE_LIMIT_ADMIN_MAX: 300,
      RATE_LIMIT_EXPENSIVE_MAX: 30,
      RATE_LIMIT_WINDOW_S: 60,
      RATE_LIMIT_WHITELIST_IPS: '',
      STRIPE_SECRET_KEY: 'sk_test_placeholder',
      STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
      STRIPE_WEBHOOK_SECRET: 'whsec_placeholder',
      TWO_FACTOR_ENCRYPTION_KEY: '0'.repeat(64),
      FLASH_SALE_CHECK_INTERVAL: 60,
      REFUND_REQUEST_DEADLINE_DAYS: 7,
      MOMO_REFUND_POLL_INTERVAL_MS: 300000,
      FIREBASE_SERVICE_ACCOUNT_JSON: undefined,
      FIREBASE_SERVICE_ACCOUNT_PATH: undefined,
      BULL_BOARD_ENABLED: true,
      MEILISEARCH_HOST: 'http://localhost:7700',
      MEILISEARCH_MASTER_KEY: 'shopee_meili_master_key',
      GOOGLE_CLIENT_ID: 'test-client-id.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_REDIRECT_URI: 'http://localhost:4000/auth/google/callback',
      GOOGLE_CLIENT_REDIRECT_URI: 'http://localhost:3000/auth/callback',
    }
  }

  const result = envSchema.safeParse(rawEnv)
  if (!result.success) {
    const formatted = formatEnvErrors(result.error)
    const lines = [
      '=== INVALID ENVIRONMENT CONFIGURATION ===',
      'The following environment variables are missing or invalid:',
      '',
      ...formatted.map((msg) => `  - ${msg}`),
      '',
      'Fix the above issues and restart the server.',
      '=========================================',
    ]
    // Print to stderr so it appears even when stdout is piped
    process.stderr.write(lines.join('\n') + '\n')
    process.exit(1)
  }
  return result.data
}

function formatEnvErrors(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.')
    return path ? `${path}: ${issue.message}` : issue.message
  })
}
