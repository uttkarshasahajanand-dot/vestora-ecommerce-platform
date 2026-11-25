import * as Order from '../models/Order.js'
import { getPagination, paginationMeta } from '../utils/pagination.js'
import HttpError from '../utils/HttpError.js'

export async function placeOrder(request, response) {
  const { firstName, lastName, address, city, postalCode, country } = request.body.shippingAddress
  const order = await Order.placeOrder(request.user.id, {
    firstName,
    lastName,
    address,
    city,
    postalCode,
    country,
  })
  return response.status(201).json({ order })
}

export async function listMyOrders(request, response) {
  const pagination = getPagination(request.query)
  const result = await Order.listUserOrders(request.user.id, pagination)
  return response.json({
    orders: result.orders,
    pagination: paginationMeta(result.page, result.limit, result.total),
  })
}

export async function getMyOrder(request, response) {
  const order = await Order.findOrderForUser(request.user.id, request.params.orderId)
  if (!order) throw new HttpError(404, 'Order not found')
  return response.json({ order })
}

export async function listAllOrders(request, response) {
  const pagination = getPagination(request.query)
  const result = await Order.listAllOrders({
    ...pagination,
    status: request.query.status,
    search: request.query.search?.trim() || '',
  })
  return response.json({
    orders: result.orders,
    pagination: paginationMeta(result.page, result.limit, result.total),
  })
}

export async function getAdminOrder(request, response) {
  const order = await Order.findOrderById(request.params.orderId)
  if (!order) throw new HttpError(404, 'Order not found')
  return response.json({ order })
}

export async function updateOrderStatus(request, response) {
  const order = await Order.updateOrderStatus(request.params.orderId, request.body.status)
  return response.json({ order })
}
