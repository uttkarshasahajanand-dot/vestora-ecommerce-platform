import * as Review from '../models/Review.js'
import { getPagination, paginationMeta } from '../utils/pagination.js'

export async function listProductReviews(request, response) {
  const pagination = getPagination(request.query)
  const result = await Review.listProductReviews(request.params.productId, pagination)
  return response.json({
    reviews: result.reviews,
    summary: result.summary,
    pagination: paginationMeta(result.page, result.limit, result.summary.count),
  })
}

export async function createReview(request, response) {
  const review = await Review.createReview(
    request.user.id,
    request.params.productId,
    request.body,
  )
  return response.status(201).json({ review })
}

export async function updateReview(request, response) {
  const review = await Review.updateOwnReview(
    request.user.id,
    request.params.reviewId,
    request.body,
  )
  return response.json({ review })
}

export async function deleteReview(request, response) {
  await Review.deleteOwnReview(request.user.id, request.params.reviewId)
  return response.status(204).end()
}
