import * as Product from '../models/Product.js'
import { getPagination, paginationMeta } from '../utils/pagination.js'
import { slugify } from '../utils/slugify.js'
import HttpError from '../utils/HttpError.js'

export async function listProducts(request, response) {
  const pagination = getPagination(request.query)
  const result = await Product.listProducts({
    ...pagination,
    search: request.query.search?.trim() || request.query.q?.trim() || '',
    category: request.query.category?.trim() || '',
    sort: request.query.sort,
  })
  return response.json({
    products: result.products,
    pagination: paginationMeta(result.page, result.limit, result.total),
  })
}

export async function getProduct(request, response) {
  const product = await Product.findProductBySlug(request.params.productId)
  if (!product) throw new HttpError(404, 'Product not found')
  return response.json({ product })
}

export async function listAdminProducts(request, response) {
  const pagination = getPagination(request.query)
  const active = request.query.active === undefined
    ? undefined
    : request.query.active === true || request.query.active === 'true'
  const result = await Product.listAdminProducts({
    ...pagination,
    search: request.query.search?.trim() || '',
    category: request.query.category?.trim() || '',
    active,
  })
  return response.json({
    products: result.products,
    pagination: paginationMeta(result.page, result.limit, result.total),
  })
}

export async function createProduct(request, response) {
  const body = request.body
  const slug = slugify(body.slug || body.name)
  if (!slug) throw new HttpError(400, 'Product name must produce a valid slug')

  const product = await Product.createProduct({
    ...body,
    slug,
    image: body.image ?? body.image_url,
    stockQuantity: body.stockQuantity ?? body.stock_quantity ?? 0,
  })
  return response.status(201).json({ product })
}

export async function updateProduct(request, response) {
  const body = { ...request.body }
  if (body.slug !== undefined) {
    body.slug = slugify(body.slug)
    if (!body.slug) throw new HttpError(400, 'Product slug is invalid')
  }
  if (body.stock_quantity !== undefined && body.stockQuantity === undefined) {
    body.stockQuantity = body.stock_quantity
  }
  if (body.image_url !== undefined && body.image === undefined) {
    body.image = body.image_url
  }
  const product = await Product.updateProduct(request.params.productId, body)
  return response.json({ product })
}

export async function deleteProduct(request, response) {
  await Product.deactivateProduct(request.params.productId)
  return response.json({ message: 'Product deactivated' })
}
