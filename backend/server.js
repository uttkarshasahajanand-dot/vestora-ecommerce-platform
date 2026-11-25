import app from './app.js'
import { assertRequiredEnvironment, env } from './config/env.js'
import { pool } from './config/database.js'

let server

async function start() {
  assertRequiredEnvironment()
  await pool.query('SELECT 1')

  server = app.listen(env.port, () => {
    console.log(`VESTORA API listening on port ${env.port}`)
  })
}

async function shutdown(signal) {
  console.log(`${signal} received; closing VESTORA API`)
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  await pool.end()
  process.exit(0)
}

process.once('SIGINT', () => shutdown('SIGINT'))
process.once('SIGTERM', () => shutdown('SIGTERM'))

start().catch(async (error) => {
  console.error('VESTORA API failed to start. Check required environment variables and MySQL availability.', error.code ?? error.message)
  await pool.end()
  process.exitCode = 1
})