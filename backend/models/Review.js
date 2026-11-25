import { pool } from '../config/database.js'
import * as Product from './Product.js'
import HttpError from '../utils/HttpError.js'

export async function listProductReviews(productSlug, { page, limit, offset }) {
  const product = await Product.findProductBySlug(productSlug)
  if (!product) throw new HttpError(404, 'Product not found')

  const [reviews] = await pool.execute(
    `SELECT r.id, r.rating, r.title, r.body, r.created_at AS createdAt,
            r.updated_at AS updatedAt, u.name AS author
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     WHERE r.product_id = (SELECT id FROM products WHERE slug = ?)
     ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [productSlug, limit, offset],
  )
  const [summaryRows] = await pool.execute(
    `SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS averageRating
     FROM reviews WHERE product_id = (SELECT id FROM products WHERE slug = ?)`,
    [productSlug],
  )
  return {
    reviews,
    summary: {
      count: summaryRows[0].count,
      averageRating: Number(Number(summaryRows[0].averageRating).toFixed(2)),
    },
    page,
    limit,
  }
}

export async function createReview(userId, productSlug, { rating, title, body }) {
  const product = await Product.findProductBySlug(productSlug)
  if (!product) throw new HttpError(404, 'Product not found')

  const [result] = await pool.execute(
    `INSERT INTO reviews (product_id, user_id, rating, title, body)
     VALUES ((SELECT id FROM products WHERE slug = ?), ?, ?, ?, ?)`,
    [productSlug, userId, rating, title || null, body],
  )
  return findReviewById(result.insertId)
}

async function findReviewById(id) {
  const [rows] = await pool.execute(
    `SELECT r.id, r.rating, r.title, r.body, r.created_at AS createdAt,
            r.updated_at AS updatedAt, u.name AS author, r.user_id AS userId
     FROM reviews r INNER JOIN users u ON u.id = r.user_id
     WHERE r.id = ? LIMIT 1`,
    [id],
  )
  return rows[0] ?? null
}

export async function listAdminReviews({ page, limit, offset, search }) {
  const filters = []
  const values = []
  if (search) {
    filters.push('(p.name LIKE ? OR r.title LIKE ? OR r.body LIKE ? OR u.name LIKE ?)')
    const term = `%${search}%`
    values.push(term, term, term, term)
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const [reviews] = await pool.execute(
    `SELECT r.id, r.rating, r.title, r.body, r.created_at AS createdAt,
            r.updated_at AS updatedAt, r.product_id AS productId,
            p.slug AS productSlug, p.name AS productName,
            r.user_id AS userId, u.name AS author
     FROM reviews r
     INNER JOIN products p ON p.id = r.product_id
     INNER JOIN users u ON u.id = r.user_id
     ${where}
     ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  )
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM reviews r
     INNER JOIN products p ON p.id = r.product_id
     INNER JOIN users u ON u.id = r.user_id
     ${where}`,
    values,
  )
  return { reviews, total: countRows[0].total, page, limit }
}

export async function deleteAdminReview(reviewId) {
  const [result] = await pool.execute('DELETE FROM reviews WHERE id = ?', [reviewId])
  if (!result.affectedRows) throw new HttpError(404, 'Review not found')
}

export async function updateOwnReview(userId, reviewId, { rating, title, body }) {
  const review = await findReviewById(reviewId)
  if (!review || String(review.userId) !== String(userId)) {
    throw new HttpError(404, 'Review not found')
  }

  const fields = []
  const values = []
  for (const [field, value] of Object.entries({ rating, title, body })) {
    if (value === undefined) continue
    fields.push(`${field} = ?`)
    values.push(value || (field === 'title' ? null : value))
  }
  if (fields.length) {
    values.push(reviewId, userId)
    await pool.execute(`UPDATE reviews SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values)
  }
  return findReviewById(reviewId)
}

export async function deleteOwnReview(userId, reviewId) {
  const [result] = await pool.execute(
    'DELETE FROM reviews WHERE id = ? AND user_id = ?',
    [reviewId, userId],
  )
  if (!result.affectedRows) throw new HttpError(404, 'Review not found')
}
