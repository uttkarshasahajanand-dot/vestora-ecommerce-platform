import api, { ApiError } from './api.js'

const ORDER_STATUSES = new Set(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
const ADDRESS_FIELDS = ['firstName', 'lastName', 'address', 'city', 'postalCode', 'country']

function invalidOrderResponse() {
  return new ApiError('The API returned an invalid order response.', { code: 'INVALID_RESPONSE' })
}

function normalizeAddress(value) {
  let address = value
  if (typeof address === 'string') {
    try {
      address = JSON.parse(address)
    } catch (cause) {
      throw new ApiError('The API returned an invalid shipping address.', {
        code: 'INVALID_RESPONSE',
        cause,
      })
    }
  }

  if (
    !address
    || typeof address !== 'object'
    || Array.isArray(address)
    || ADDRESS_FIELDS.some((field) => typeof address[field] !== 'string')
  ) {
    throw new ApiError('The API returned an invalid shipping address.', { code: 'INVALID_RESPONSE' })
  }

  return Object.fromEntries(ADDRESS_FIELDS.map((field) => [field, address[field]]))
}

function normalizeOrder(order, { withItems = false } = {}) {
  const subtotal = Number(order?.subtotal)
  const shippingAmount = Number(order?.shippingAmount)
  const total = Number(order?.total)
  const id = String(order?.id ?? '')

  if (
    !/^\d+$/.test(id)
    || typeof order.orderNumber !== 'string'
    || !ORDER_STATUSES.has(order.status)
    || !Number.isFinite(subtotal)
    || subtotal < 0
    || !Number.isFinite(shippingAmount)
    || shippingAmount < 0
    || !Number.isFinite(total)
    || total < 0
    || typeof order.currency !== 'string'
    || !/^[A-Z]{3}$/.test(order.currency)
    || typeof order.createdAt !== 'string'
  ) {
    throw invalidOrderResponse()
  }

  const normalized = {
    ...order,
    id,
    subtotal,
    shippingAmount,
    total,
  }

  if (order.shippingAddress !== undefined) {
    normalized.shippingAddress = normalizeAddress(order.shippingAddress)
  }

  if (withItems) {
    if (!Array.isArray(order.items)) throw invalidOrderResponse()
    normalized.items = order.items.map((item) => {
      const price = Number(item?.price)
      const quantity = Number(item?.quantity)
      if (
        !item
        || typeof item.id !== 'string'
        || typeof item.name !== 'string'
        || typeof item.image !== 'string'
        || typeof item.color !== 'string'
        || typeof item.size !== 'string'
        || !Number.isFinite(price)
        || price < 0
        || !Number.isInteger(quantity)
        || quantity < 1
      ) {
        throw invalidOrderResponse()
      }
      return { ...item, price, quantity }
    })
  }

  return normalized
}

export async function createOrder(shippingAddress) {
  const payload = await api.post('/orders', { shippingAddress })
  if (!payload?.order) throw invalidOrderResponse()
  return normalizeOrder(payload.order, { withItems: true })
}

export async function fetchMyOrders({ page = 1, limit = 20, signal } = {}) {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) })
  const payload = await api.get(`/orders?${query}`, { signal })
  const pagination = payload?.pagination
  const total = Number(pagination?.total)
  if (
    !Array.isArray(payload?.orders)
    || !Number.isInteger(pagination?.page)
    || !Number.isInteger(pagination?.limit)
    || !Number.isSafeInteger(total)
    || total < 0
    || !Number.isInteger(pagination?.totalPages)
  ) {
    throw invalidOrderResponse()
  }
  return {
    orders: payload.orders.map((order) => normalizeOrder(order)),
    pagination: { ...pagination, total },
  }
}

export async function fetchMyOrder(orderId, { signal } = {}) {
  const payload = await api.get(`/orders/${encodeURIComponent(orderId)}`, { signal })
  if (!payload?.order) throw invalidOrderResponse()
  return normalizeOrder(payload.order, { withItems: true })
}
