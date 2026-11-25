import { Router } from 'express'
import { param, query } from 'express-validator'
import * as productController from '../controllers/productController.js'
import { validate } from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get(
  '/',
  [
    query('search').optional().isString().trim().isLength({ max: 100 }),
    query('q').optional().isString().trim().isLength({ max: 100 }),
    query('category').optional().isString().trim().isLength({ max: 120 }),
    query('sort').optional().isIn(['newest', 'price_asc', 'price_desc', 'name_asc']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  asyncHandler(productController.listProducts),
)

router.get(
  '/:productId',
  param('productId').isSlug().withMessage('Product ID must be a product slug'),
  validate,
  asyncHandler(productController.getProduct),
)

export default router
