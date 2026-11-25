import { validationResult } from 'express-validator'

export function validate(request, response, next) {
  const result = validationResult(request)
  if (result.isEmpty()) return next()

  return response.status(400).json({
    error: 'Validation failed',
    details: result.array().map(({ path, msg }) => ({ field: path, message: msg })),
  })
}
