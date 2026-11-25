import { Router } from 'express'
import { body, param, query } from 'express-validator'
import * as reviewController from '../controllers/reviewController.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import validateBodyShape from '../middleware/validateBodyShape.js'
import asyncHandler from '../utils/asyncHandler.js'

const router = Router()

router.get(
  '/products/:productId/reviews',
  [
    param('productId').isSlug(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  asyncHandler(reviewController.listProductReviews),
)

router.post(
  '/products/:productId/reviews',
  authenticate,
  validateBodyShape(['rating', 'title', 'body']),
  [
    param('productId').isSlug(),
    body('rating').isInt({ min: 1, max: 5 }).toInt(),
    body('title').optional({ nullable: true }).isString().trim().isLength({ max: 160 }),
    body('body').isString().trim().isLength({ min: 3, max: 5000 }),
  ],
  validate,
  asyncHandler(reviewController.createReview),
)

router.patch(
  '/reviews/:reviewId',
  authenticate,
  validateBodyShape(['rating', 'title', 'body'], { nonEmpty: true }),
  [
    param('reviewId').isInt({ min: 1 }),
    body('rating').optional().isInt({ min: 1, max: 5 }).toInt(),
    body('title').optional({ nullable: true }).isString().trim().isLength({ max: 160 }),
    body('body').optional().isString().trim().isLength({ min: 3, max: 5000 }),
  ],
  validate,
  asyncHandler(reviewController.updateReview),
)

router.delete(
  '/reviews/:reviewId',
  authenticate,
  param('reviewId').isInt({ min: 1 }),
  validate,
  asyncHandler(reviewController.deleteReview),
)

export default router
