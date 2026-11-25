import * as Admin from '../models/Admin.js'
import * as User from '../models/User.js'
import * as Product from '../models/Product.js'
import * as Order from '../models/Order.js'
import * as Review from '../models/Review.js'
import { getPagination, paginationMeta } from '../utils/pagination.js'
import HttpError from '../utils/HttpError.js'

export async function getDashboard(request, response) {
  return response.json({ stats: await Admin.getDashboardStats() })
}

export async function listUsers(request, response) {
  const pagination = getPagination(request.query)
  const role = request.query.role
  const result = await User.listUsers({
    ...pagination,
    search: request.query.search?.trim() || '',
    role,
  })
  return response.json({
    users: result.users,
    pagination: paginationMeta(result.page, result.limit, result.total),
  })
}

export async function getUserDetails(request, response) {
  const user = await User.findPublicById(request.params.userId)
  if (!user) throw new HttpError(404, 'User not found')
  return response.json({ user })
}

export async function listUserOrders(request, response) {
  const user = await User.findPublicById(request.params.userId)
  if (!user) throw new HttpError(404, 'User not found')
  const pagination = getPagination(request.query)
  const result = await Order.listUserOrders(request.params.userId, pagination)
  return response.json({
    orders: result.orders,
    pagination: paginationMeta(result.page, result.limit, result.total),
  })
}

export async function updateUserRole(request, response) {
  const user = await User.updateRole(
    request.params.userId,
    request.body.role,
    request.user.id,
  )
  return response.json({ user })
}

export async function listInventory(request, response) {
  const pagination = getPagination(request.query)
  const threshold = request.query.threshold === undefined
    ? 5
    : Number.parseInt(request.query.threshold, 10)
  const result = await Product.listInventory({ ...pagination, threshold })
  return response.json({
    products: result.products,
    threshold,
    pagination: paginationMeta(result.page, result.limit, result.total),
  })
}

export async function listReviews(request, response) {
  const pagination = getPagination(request.query)
  const result = await Review.listAdminReviews({
    ...pagination,
    search: request.query.search?.trim() || '',
  })
  return response.json({
    reviews: result.reviews,
    pagination: paginationMeta(result.page, result.limit, result.total),
  })
}

export async function deleteReview(request, response) {
  await Review.deleteAdminReview(request.params.reviewId)
  return response.status(204).end()
}
