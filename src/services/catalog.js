import { get, ApiError } from './api.js'

const PRODUCT_PAGE_SIZE = 100

function normalizeProduct(product) {
  const price = Number(product?.price)
  const stockQuantity = Number(product?.stockQuantity)

  if (
    !product
    || typeof product.id !== 'string'
    || typeof product.name !== 'string'
    || typeof product.category !== 'string'
    || !Number.isFinite(price)
    || price < 0
    || !Number.isInteger(stockQuantity)
    || stockQuantity < 0
  ) {
    throw new ApiError('The API returned an invalid product.', { code: 'INVALID_RESPONSE' })
  }

  return { ...product, price, stockQuantity }
}

function validateProductList(payload) {
  if (
    !Array.isArray(payload?.products)
    || !Number.isInteger(payload?.pagination?.totalPages)
    || payload.pagination.totalPages < 0
  ) {
    throw new ApiError('The API returned an invalid product list.', { code: 'INVALID_RESPONSE' })
  }
}

export async function fetchProducts({ signal } = {}) {
  const firstPage = await get(`/products?page=1&limit=${PRODUCT_PAGE_SIZE}`, { signal })
  validateProductList(firstPage)
  const products = firstPage.products.map(normalizeProduct)

  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const result = await get(`/products?page=${page}&limit=${PRODUCT_PAGE_SIZE}`, { signal })
    validateProductList(result)
    products.push(...result.products.map(normalizeProduct))
  }

  return products
}

export async function fetchProduct(productId, { signal } = {}) {
  const payload = await get(`/products/${encodeURIComponent(productId)}`, { signal })
  if (!payload?.product) {
    throw new ApiError('The API returned an invalid product response.', { code: 'INVALID_RESPONSE' })
  }
  return normalizeProduct(payload.product)
}

export async function fetchCategories({ signal } = {}) {
  const payload = await get('/categories', { signal })
  if (!Array.isArray(payload?.categories)) {
    throw new ApiError('The API returned an invalid category list.', { code: 'INVALID_RESPONSE' })
  }

  return payload.categories.map((category) => {
    if (typeof category?.name !== 'string' || typeof category.slug !== 'string') {
      throw new ApiError('The API returned an invalid category.', { code: 'INVALID_RESPONSE' })
    }
    return category
  })
}
