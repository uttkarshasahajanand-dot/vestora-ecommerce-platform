import { Router } from 'express'
import * as categoryController from '../controllers/categoryController.js'
import { validate } from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'
import { body, param } from 'express-validator'
import validateBodyShape from '../middleware/validateBodyShape.js'

const router = Router()

router.get('/', asyncHandler(categoryController.listCategories))

router.post(
  '/',
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
  '/:categoryId',
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
  '/:categoryId',
  param('categoryId').isInt({ min: 1 }),
  validate,
  asyncHandler(categoryController.deleteCategory),
)

export default router
