import { Router } from 'express'
import { body, header, param, query } from 'express-validator'
import * as cartController from '../controllers/cartController.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import validateBodyShape from '../middleware/validateBodyShape.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()
router.use(authenticate)

router.get('/', asyncHandler(cartController.getCart))
router.post(
  '/items',
  validateBodyShape(['productId', 'size', 'quantity']),
  [
    header('idempotency-key').isUUID().withMessage('A valid Idempotency-Key UUID is required'),
    body('productId').isSlug().withMessage('A product slug is required'),
    body('size').optional().isIn(['One size', 'XS', 'S', 'M', 'L', 'XL']),
    body('quantity').optional().isInt({ min: 1, max: 1000 }).toInt(),
  ],
  validate,
  asyncHandler(cartController.addItem),
)

router.post(
  '/merge',
  validateBodyShape(['items']),
  [
    header('idempotency-key').isUUID().withMessage('A valid Idempotency-Key UUID is required'),
    body('items').isArray({ min: 1, max: 100 }),
    body('items.*.productId').isSlug().withMessage('A product slug is required'),
    body('items.*.size').isIn(['One size', 'XS', 'S', 'M', 'L', 'XL']),
    body('items.*.quantity').isInt({ min: 1, max: 1000 }).toInt(),
  ],
  validate,
  asyncHandler(cartController.mergeItems),
)

router.patch(
  '/items/:productId',
  validateBodyShape(['size', 'quantity'], { nonEmpty: true }),
  [
    param('productId').isSlug(),
    body('size').optional().isIn(['One size', 'XS', 'S', 'M', 'L', 'XL']),
    body('quantity').isInt({ min: 1, max: 1000 }).toInt(),
  ],
  validate,
  asyncHandler(cartController.updateItem),
)

router.delete(
  '/items/:productId',
  [
    param('productId').isSlug(),
    query('size').optional().isIn(['One size', 'XS', 'S', 'M', 'L', 'XL']),
  ],
  validate,
  asyncHandler(cartController.removeItem),
)

export default router
