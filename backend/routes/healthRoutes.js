import { Router } from 'express'
import { pool } from '../config/database.js'

const router = Router()

router.get('/', async (request, response) => {
  try {
    await pool.query('SELECT 1')
    return response.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    console.error('Health check could not reach MySQL', error.code ?? error.message)
    return response.status(503).json({ status: 'unavailable', database: 'unavailable' })
  }
})

export default router
