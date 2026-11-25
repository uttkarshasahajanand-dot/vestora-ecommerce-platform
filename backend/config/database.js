import mysql from 'mysql2/promise'
import { env } from './env.js'

export const pool = mysql.createPool({
  host: env.dbHost || '127.0.0.1',
  port: env.dbPort,
  user: env.dbUser || undefined,
  password: env.dbPassword,
  database: env.dbName || undefined,
  waitForConnections: true,
  connectionLimit: env.dbConnectionLimit,
  queueLimit: 0,
  charset: 'utf8mb4',
  decimalNumbers: true,
  supportBigNumbers: true,
  bigNumberStrings: true,
  enableKeepAlive: true,
})
