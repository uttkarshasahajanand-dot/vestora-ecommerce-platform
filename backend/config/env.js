import 'dotenv/config'

const port = Number.parseInt(process.env.PORT ?? '4000', 10)
const dbPort = Number.parseInt(process.env.DB_PORT ?? '3306', 10)
const connectionLimit = Number.parseInt(process.env.DB_CONNECTION_LIMIT ?? '10', 10)

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number.isInteger(port) && port > 0 ? port : 4000,
  dbHost: process.env.DB_HOST ?? '',
  dbPort: Number.isInteger(dbPort) && dbPort > 0 ? dbPort : 3306,
  dbUser: process.env.DB_USER ?? '',
  dbPassword: process.env.DB_PASSWORD ?? '',
  dbName: process.env.DB_NAME ?? '',
  dbConnectionLimit: Number.isInteger(connectionLimit) && connectionLimit > 0 ? connectionLimit : 10,
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  frontendOrigins: (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  authRateLimitWindowMs: Number.parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS ?? '900000', 10),
  authRateLimitMax: Number.parseInt(process.env.AUTH_RATE_LIMIT_MAX ?? '20', 10),
}

export function assertRequiredEnvironment() {
  const missing = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET']
    .filter((key) => !process.env[key]?.trim())

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  if (env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long')
  }
}
