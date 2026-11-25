export const TOKEN_STORAGE_KEY = 'vestora-token'
export const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:4000/api'
).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, details = [], code = 'API_ERROR', cause } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
    this.code = code
    if (cause !== undefined) this.cause = cause
  }
}

function getStoredToken() {
  try {
    return globalThis.sessionStorage?.getItem(TOKEN_STORAGE_KEY) ?? null
  } catch (cause) {
    throw new ApiError('Unable to read the saved VESTORA session token.', {
      code: 'TOKEN_STORAGE_ERROR',
      cause,
    })
  }
}

export function saveAuthToken(token) {
  if (typeof token !== 'string' || !token.trim()) {
    throw new TypeError('A non-empty JWT token is required')
  }

  try {
    globalThis.sessionStorage?.setItem(TOKEN_STORAGE_KEY, token)
  } catch (cause) {
    throw new ApiError('Unable to save the VESTORA session token in this browser.', {
      code: 'TOKEN_STORAGE_ERROR',
      cause,
    })
  }
}

export function clearAuthToken() {
  try {
    globalThis.sessionStorage?.removeItem(TOKEN_STORAGE_KEY)
  } catch (cause) {
    throw new ApiError('Unable to clear the saved VESTORA session token.', {
      code: 'TOKEN_STORAGE_ERROR',
      cause,
    })
  }
}

function formatErrorMessage(payload, status) {
  const message = typeof payload?.error === 'string'
    ? payload.error
    : typeof payload?.message === 'string'
      ? payload.message
      : `The request failed with status ${status}.`

  if (!Array.isArray(payload?.details) || payload.details.length === 0) return message

  const details = payload.details
    .map((detail) => {
      if (typeof detail === 'string') return detail
      const field = typeof detail?.field === 'string' ? `${detail.field}: ` : ''
      return `${field}${detail?.message || 'Invalid value'}`
    })
    .filter(Boolean)

  return details.length ? `${message}: ${details.join('; ')}` : message
}

async function readResponse(response) {
  if (response.status === 204) return null

  let responseText
  try {
    responseText = await response.text()
  } catch (cause) {
    throw new ApiError('The API response could not be read. Please try again.', {
      status: response.status,
      code: 'INVALID_RESPONSE',
      cause,
    })
  }

  if (!responseText.trim()) return null

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('json')) {
    if (!response.ok) {
      throw new ApiError(`The API request failed with status ${response.status}.`, {
        status: response.status,
        code: 'HTTP_ERROR',
      })
    }
    throw new ApiError('The API returned a response that was not JSON.', {
      status: response.status,
      code: 'INVALID_RESPONSE',
    })
  }

  try {
    return JSON.parse(responseText)
  } catch (cause) {
    throw new ApiError('The API returned invalid JSON. Please try again.', {
      status: response.status,
      code: 'INVALID_RESPONSE',
      cause,
    })
  }
}

async function request(method, path, body, options = {}) {
  const { headers: suppliedHeaders, token, signal, ...fetchOptions } = options
  const headers = new Headers(suppliedHeaders)
  headers.set('Accept', 'application/json')

  if (body !== undefined) headers.set('Content-Type', 'application/json')

  const authToken = token === undefined ? getStoredToken() : token
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`)

  const normalizedPath = String(path).replace(/^\/+/, '')
  const url = `${API_BASE_URL}/${normalizedPath}`

  let response
  try {
    response = await fetch(url, {
      ...fetchOptions,
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    })
  } catch (cause) {
    const message = cause?.name === 'AbortError'
      ? 'The API request was cancelled.'
      : `Unable to reach the VESTORA API at ${API_BASE_URL}. Check that the backend is running and CORS allows this frontend.`
    throw new ApiError(message, {
      code: cause?.name === 'AbortError' ? 'REQUEST_ABORTED' : 'NETWORK_ERROR',
      cause,
    })
  }

  const payload = await readResponse(response)
  if (!response.ok) {
    throw new ApiError(formatErrorMessage(payload, response.status), {
      status: response.status,
      details: Array.isArray(payload?.details) ? payload.details : [],
      code: 'HTTP_ERROR',
    })
  }
  return payload
}

export function get(path, options = {}) {
  return request('GET', path, undefined, options)
}

export function post(path, body, options = {}) {
  return request('POST', path, body, options)
}

export function put(path, body, options = {}) {
  return request('PUT', path, body, options)
}

export function patch(path, body, options = {}) {
  return request('PATCH', path, body, options)
}

export function deleteRequest(path, options = {}) {
  const { body, ...requestOptions } = options
  return request('DELETE', path, body, requestOptions)
}

const api = Object.freeze({
  get,
  post,
  put,
  patch,
  delete: deleteRequest,
})

export default api
