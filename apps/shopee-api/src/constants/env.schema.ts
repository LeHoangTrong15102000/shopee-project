/**
 * Environment variable validation schema
 *
 * Validates all required env vars at startup using zod.
 * The server will throw and exit with a clear error message listing
 * ALL missing or invalid vars if any fail validation.
 */
import { z, ZodError } from 'zod'

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(4000),

  MONGO_URI: z
    .string()
    .min(1, 'MONGO_URI is required'),

  SECRET_KEY_JWT: z
    .string()
    .min(32, 'JWT_SECRET (SECRET_KEY_JWT) must be at least 32 characters — use a strong random value'),

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
