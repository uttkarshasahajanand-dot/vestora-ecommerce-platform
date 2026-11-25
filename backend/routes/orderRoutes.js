import { Router } from 'express'
import { body, param, query } from 'express-validator'
import * as orderController from '../controllers/orderController.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import validateBodyShape from '../middleware/validateBodyShape.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()
router.use(authenticate)

router.post(
  '/',
  validateBodyShape(['shippingAddress']),
  [
    body('shippingAddress').isObject().withMessage('Shipping address is required'),
    body('shippingAddress').custom((value) => value !== null
      && typeof value === 'object'
      && !Array.isArray(value)
      && Object.keys(value).every((key) => ['firstName', 'lastName', 'address', 'city', 'postalCode', 'country'].includes(key)))
      .withMessage('Shipping address contains unsupported fields'),
    body('shippingAddress.firstName').isString().trim().isLength({ min: 1, max: 100 }),
    body('shippingAddress.lastName').isString().trim().isLength({ min: 1, max: 100 }),
    body('shippingAddress.address').isString().trim().isLength({ min: 3, max: 255 }),
    body('shippingAddress.city').isString().trim().isLength({ min: 1, max: 100 }),
    body('shippingAddress.postalCode').isString().trim().isLength({ min: 1, max: 30 }),
    body('shippingAddress.country').isString().trim().isLength({ min: 2, max: 100 }),
  ],
  validate,
  asyncHandler(orderController.placeOrder),
)

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  asyncHandler(orderController.listMyOrders),
)

router.get(
  '/:orderId',
  param('orderId').isInt({ min: 1 }),
  validate,
  asyncHandler(orderController.getMyOrder),
)

export default router
