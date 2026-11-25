import { Router } from 'express'
import { body } from 'express-validator'
import rateLimit from 'express-rate-limit'
import * as authController from '../controllers/authController.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import asyncHandler from '../utils/asyncHandler.js'
import { env } from '../config/env.js'
import validateBodyShape from '../middleware/validateBodyShape.js'

const router = Router()
const authLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
})

const emailRule = () => body('email').trim().isEmail().withMessage('A valid email address is required').normalizeEmail()

router.post(
  '/register',
  authLimiter,
  validateBodyShape(['name', 'email', 'password']),
  [
    body('name').isString().trim().isLength({ min: 2, max: 120 }).withMessage('Name must be between 2 and 120 characters'),
    emailRule(),
    body('password')
      .isString()
      .isLength({ min: 8, max: 128 })
      .withMessage('Password must be between 8 and 128 characters'),
  ],
  validate,
  asyncHandler(authController.register),
)

router.post(
  '/login',
  authLimiter,
  validateBodyShape(['email', 'password']),
  [
    emailRule(),
    body('password').isString().isLength({ min: 1, max: 128 }).withMessage('Password is required'),
  ],
  validate,
  asyncHandler(authController.login),
)

router.get('/me', authenticate, asyncHandler(authController.getProfile))
router.patch(
  '/me',
  authenticate,
  validateBodyShape(['name', 'email'], { nonEmpty: true }),
  [
    body('name').optional().isString().trim().isLength({ min: 2, max: 120 }),
    body('email').optional().trim().isEmail().normalizeEmail(),
  ],
  validate,
  asyncHandler(authController.updateProfile),
)

export default router
