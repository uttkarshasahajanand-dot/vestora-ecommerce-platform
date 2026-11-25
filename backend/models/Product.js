import { pool } from '../config/database.js'
import * as Category from './Category.js'
import HttpError from '../utils/HttpError.js'

const productSelect = `
  SELECT p.slug AS id, p.name, c.name AS category, p.price, p.color,
         p.image_url AS image, p.description, p.label,
         p.stock_quantity AS stockQuantity, p.sku, p.is_active AS isActive,
         p.created_at AS createdAt, p.updated_at AS updatedAt
  FROM products p
  INNER JOIN categories c ON c.id = p.category_id`

export async function listProducts({ page, limit, offset, search, category, sort }) {
  const where = ['p.is_active = TRUE', 'c.is_active = TRUE']
  const values = []

  if (search) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR p.color LIKE ?)')
    values.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (category) {
    where.push('(c.slug = ? OR c.name = ?)')
    values.push(category, category)
  }

  const orderBy = {
    newest: 'p.created_at DESC',
    price_asc: 'p.price ASC, p.name ASC',
    price_desc: 'p.price DESC, p.name ASC',
    name_asc: 'p.name ASC',
  }[sort] ?? 'p.created_at DESC'
  const whereClause = `WHERE ${where.join(' AND ')}`

  const [rows] = await pool.execute(
    `${productSelect} ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  )
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM products p
     INNER JOIN categories c ON c.id = p.category_id ${whereClause}`,
    values,
  )
  return { products: rows, total: countRows[0].total, page, limit }
}

export async function findProductBySlug(slug, { includeInactive = false } = {}) {
  const activeClause = includeInactive ? '' : 'AND p.is_active = TRUE AND c.is_active = TRUE'
  const [rows] = await pool.execute(
    `${productSelect} WHERE p.slug = ? ${activeClause} LIMIT 1`,
    [slug],
  )
  return rows[0] ?? null
}

export async function listAdminProducts({ page, limit, offset, search, category, active }) {
  const where = []
  const values = []
  if (search) {
    where.push('(p.name LIKE ? OR p.slug LIKE ? OR p.sku LIKE ?)')
    values.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (category) {
    where.push('(c.slug = ? OR c.name = ?)')
    values.push(category, category)
  }
  if (active !== undefined) {
    where.push('p.is_active = ?')
    values.push(active)
  }
  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const [rows] = await pool.execute(
    `${productSelect} ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  )
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM products p
     INNER JOIN categories c ON c.id = p.category_id ${whereClause}`,
    values,
  )
  return { products: rows, total: countRows[0].total, page, limit }
}

export async function createProduct(product) {
  const categoryId = await Category.resolveCategoryId(product.category ?? product.category_id)
  const slug = product.slug
  const sku = product.sku ?? `VESTORA-${slug.toUpperCase()}`.slice(0, 80)

  await pool.execute(
    `INSERT INTO products
       (category_id, slug, sku, name, description, color, image_url, label, price, stock_quantity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      categoryId,
      slug,
      sku,
      product.name,
      product.description,
      product.color ?? '',
      product.image ?? product.image_url,
      product.label ?? null,
      product.price,
      product.stockQuantity ?? product.stock_quantity ?? 0,
    ],
  )
  return findProductBySlug(slug, { includeInactive: true })
}

export async function updateProduct(slug, input) {
  const existing = await findProductBySlug(slug, { includeInactive: true })
  if (!existing) throw new HttpError(404, 'Product not found')

  const fields = []
  const values = []
  const allowedFields = {
    name: 'name',
    slug: 'slug',
    sku: 'sku',
    description: 'description',
    color: 'color',
    label: 'label',
    price: 'price',
    isActive: 'is_active',
    stockQuantity: 'stock_quantity',
  }

  for (const [inputField, column] of Object.entries(allowedFields)) {
    if (input[inputField] === undefined) continue
    fields.push(`${column} = ?`)
    values.push(input[inputField])
  }
  if (input.image !== undefined || input.image_url !== undefined) {
    fields.push('image_url = ?')
    values.push(input.image ?? input.image_url)
  }
  if (input.category !== undefined || input.category_id !== undefined) {
    fields.push('category_id = ?')
    values.push(await Category.resolveCategoryId(input.category ?? input.category_id))
  }

  if (fields.length) {
    values.push(slug)
    await pool.execute(`UPDATE products SET ${fields.join(', ')} WHERE slug = ?`, values)
  }
  return findProductBySlug(input.slug ?? slug, { includeInactive: true })
}

export async function deactivateProduct(slug) {
  const [result] = await pool.execute('UPDATE products SET is_active = FALSE WHERE slug = ?', [slug])
  if (!result.affectedRows) throw new HttpError(404, 'Product not found')
}

export async function listInventory({ threshold, page, limit, offset }) {
  const [rows] = await pool.execute(
    `${productSelect} WHERE p.is_active = TRUE AND p.stock_quantity <= ?
     ORDER BY p.stock_quantity ASC, p.name ASC LIMIT ? OFFSET ?`,
    [threshold, limit, offset],
  )
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM products WHERE is_active = TRUE AND stock_quantity <= ?',
    [threshold],
  )
  return { products: rows, total: countRows[0].total, page, limit }
}
