export default function errorHandler(error, request, response, next) {
  if (response.headersSent) return next(error)

  if (error.code === 'ER_DUP_ENTRY') {
    return response.status(409).json({ error: 'A record with those details already exists' })
  }
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return response.status(400).json({ error: 'The referenced record does not exist' })
  }
  if (error.status === 400 && error.type === 'entity.parse.failed') {
    return response.status(400).json({ error: 'Request body contains invalid JSON' })
  }

  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500
  const message = status === 500 ? 'Internal server error' : error.message

  if (status >= 500) {
    console.error('Request failed', {
      method: request.method,
      path: request.originalUrl,
      code: error.code,
      message: error.message,
    })
  }

  return response.status(status).json({
    error: message,
    ...(error.details ? { details: error.details } : {}),
  })
}
