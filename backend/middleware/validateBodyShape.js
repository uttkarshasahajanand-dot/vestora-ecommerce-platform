import HttpError from '../utils/HttpError.js'
import { onlyAllowedKeys } from '../utils/validation.js'

export default function validateBodyShape(allowedKeys, { nonEmpty = false, requireAny = [] } = {}) {
  return function bodyShapeGuard(request, response, next) {
    const body = request.body
    if (!onlyAllowedKeys(body, allowedKeys)) {
      return next(new HttpError(400, 'Request body contains unsupported fields or must be a JSON object'))
    }
    if (nonEmpty && Object.keys(body).length === 0) {
      return next(new HttpError(400, 'Request body must not be empty'))
    }
    for (const fields of requireAny) {
      if (!fields.some((field) => body[field] !== undefined && body[field] !== null && body[field] !== '')) {
        return next(new HttpError(400, `Provide at least one of: ${fields.join(', ')}`))
      }
    }
    return next()
  }
}
