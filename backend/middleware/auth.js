import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import HttpError from '../utils/HttpError.js'

export function authenticate(request, response, next) {
  const authorization = request.get('authorization')
  const [scheme, token] = authorization?.split(' ') ?? []

  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Authentication required'))
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] })
    if (typeof payload !== 'object' || !payload.sub || !['customer', 'admin'].includes(payload.role)) {
      return next(new HttpError(401, 'Invalid authentication token'))
    }

    request.user = { id: String(payload.sub), role: payload.role }
    return next()
  } catch {
    return next(new HttpError(401, 'Invalid or expired authentication token'))
  }
}

export function authorize(...roles) {
  return function roleGuard(request, response, next) {
    if (!request.user || !roles.includes(request.user.role)) {
      return next(new HttpError(403, 'You do not have permission to perform this action'))
    }
    return next()
  }
}
