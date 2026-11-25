import HttpError from '../utils/HttpError.js'

export default function notFound(request, response, next) {
  next(new HttpError(404, 'Route not found'))
}
