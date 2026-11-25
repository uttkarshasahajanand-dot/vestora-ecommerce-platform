import { Router } from 'express'
import { body, param, query } from 'express-validator'
import * as adminController from '../controllers/adminController.js'
import * as categoryController from '../controllers/categoryController.js'
import * as orderController from '../controllers/orderController.js'
import * as productController from '../controllers/productController.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import validateBodyShape from '../middleware/validateBodyShape.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()
router.use(authenticate, authorize('admin'))

router.get('/dashboard', asyncHandler(adminController.getDashboard))
router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim().isLength({ max: 100 }),
    query('role').optional().isIn(['customer', 'admin']),
  ],
  validate,
  asyncHandler(adminController.listUsers),
)
router.get(
    '/users/:userId',
    param('userId').isInt({ min: 1 }),
    validate,
    asyncHandler(adminController.getUserDetails),
)
router.get(
    '/users/:userId/orders',
    [
      param('userId').isInt({ min: 1 }),
      query('page').optional().isInt({ min: 1 }),
      query('limit').optional().isInt({ min: 1, max: 100 }),
    ],
    validate,
    asyncHandler(adminController.listUserOrders),
)
router.patch(
    '/users/:userId/role',
    validateBodyShape(['role']),
    [
      param('userId').isInt({ min: 1 }),
      body('role').isIn(['customer', 'admin']),
    ],
    validate,
    asyncHandler(adminController.updateUserRole),
)
router.get(
  '/inventory',
  [
    query('threshold').optional().isInt({ min: 0, max: 100000 }),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  asyncHandler(adminController.listInventory),
)

router.get(
  '/products',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim().isLength({ max: 100 }),
    query('category').optional().isString().trim().isLength({ max: 120 }),
    query('active').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(productController.listAdminProducts),
)

const productFields = [
  body('name').isString().trim().isLength({ min: 2, max: 180 }),
  body('slug').optional().isString().trim().isLength({ min: 1, max: 160 }),
  body('sku').optional().isString().trim().isLength({ min: 2, max: 80 }),
  body('category').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('category_id').optional().isInt({ min: 1 }),
  body('description').isString().trim().isLength({ min: 5, max: 10000 }),
  body('color').optional().isString().trim().isLength({ max: 100 }),
  body('image').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }).isLength({ max: 2048 }),
  body('image_url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }).isLength({ max: 2048 }),
  body('label').optional({ nullable: true }).isString().trim().isLength({ max: 60 }),
  body('price').isFloat({ min: 0, max: 100000000 }).toFloat(),
  body('stockQuantity').optional().isInt({ min: 0, max: 10000000 }).toInt(),
  body('stock_quantity').optional().isInt({ min: 0, max: 10000000 }).toInt(),
]

router.post(
  '/products',
  validateBodyShape([
    'name', 'slug', 'sku', 'category', 'category_id', 'description',
    'color', 'image', 'image_url', 'label', 'price', 'stockQuantity', 'stock_quantity',
  ], {
    requireAny: [['category', 'category_id'], ['image', 'image_url']],
  }),
  productFields,
  validate,
  asyncHandler(productController.createProduct),
)

router.patch(
  '/products/:productId',
  validateBodyShape([
    'name', 'slug', 'sku', 'category', 'category_id', 'description',
    'color', 'image', 'image_url', 'label', 'price', 'stockQuantity',
    'stock_quantity', 'isActive',
  ], { nonEmpty: true }),
  [
    param('productId').isSlug(),
    body('name').optional().isString().trim().isLength({ min: 2, max: 180 }),
    body('slug').optional().isString().trim().isLength({ min: 1, max: 160 }),
    body('sku').optional().isString().trim().isLength({ min: 2, max: 80 }),
    body('category').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('category_id').optional().isInt({ min: 1 }),
    body('description').optional().isString().trim().isLength({ min: 5, max: 10000 }),
    body('color').optional().isString().trim().isLength({ max: 100 }),
    body('image').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }).isLength({ max: 2048 }),
    body('image_url').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }).isLength({ max: 2048 }),
    body('label').optional({ nullable: true }).isString().trim().isLength({ max: 60 }),
    body('price').optional().isFloat({ min: 0, max: 100000000 }).toFloat(),
    body('stockQuantity').optional().isInt({ min: 0, max: 10000000 }).toInt(),
    body('stock_quantity').optional().isInt({ min: 0, max: 10000000 }).toInt(),
    body('isActive').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(productController.updateProduct),
)
router.delete(
  '/products/:productId',
  param('productId').isSlug(),
  validate,
  asyncHandler(productController.deleteProduct),
)

router.get('/categories', asyncHandler(categoryController.listAdminCategories))
router.post(
  '/categories',
  validateBodyShape(['name', 'slug', 'description']),
  [
    body('name').isString().trim().isLength({ min: 2, max: 100 }),
    body('slug').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('description').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  ],
  validate,
  asyncHandler(categoryController.createCategory),
)
router.patch(
  '/categories/:categoryId',
  validateBodyShape(['name', 'slug', 'description', 'isActive'], { nonEmpty: true }),
  [
    param('categoryId').isInt({ min: 1 }),
    body('name').optional().isString().trim().isLength({ min: 2, max: 100 }),
    body('slug').optional().isString().trim().isLength({ min: 1, max: 120 }),
    body('description').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
    body('isActive').optional().isBoolean().toBoolean(),
  ],
  validate,
  asyncHandler(categoryController.updateCategory),
)
router.delete(
  '/categories/:categoryId',
  param('categoryId').isInt({ min: 1 }),
  validate,
  asyncHandler(categoryController.deleteCategory),
)

router.get(
  '/orders',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('status').optional().isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
    query('search').optional().isString().trim().isLength({ max: 100 }),
  ],
  validate,
  asyncHandler(orderController.listAllOrders),
)
router.get(
  '/orders/:orderId',
  param('orderId').isInt({ min: 1 }),
  validate,
  asyncHandler(orderController.getAdminOrder),
)
router.patch(
  '/orders/:orderId/status',
  [
    param('orderId').isInt({ min: 1 }),
    body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  ],
  validate,
  asyncHandler(orderController.updateOrderStatus),
)

router.get(
  '/reviews',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().isString().trim().isLength({ max: 100 }),
  ],
  validate,
  asyncHandler(adminController.listReviews),
)
router.delete(
  '/reviews/:reviewId',
  param('reviewId').isInt({ min: 1 }),
  validate,
  asyncHandler(adminController.deleteReview),
)

export default router
