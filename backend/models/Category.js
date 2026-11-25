import { pool } from '../config/database.js'
import HttpError from '../utils/HttpError.js'

export async function listCategories({ includeInactive = false } = {}) {
  const where = includeInactive ? '' : 'WHERE is_active = TRUE'
  const [rows] = await pool.execute(
    `SELECT id, name, slug, description, is_active AS isActive,
            created_at AS createdAt, updated_at AS updatedAt
     FROM categories ${where} ORDER BY name`,
  )
  return rows
}

export async function findCategoryById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, slug, description, is_active AS isActive FROM categories WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

export async function resolveCategoryId(input) {
  let rows
  if (Number.isInteger(Number(input)) && String(input).trim() !== '') {
    const [found] = await pool.execute(
      'SELECT id FROM categories WHERE id = ? AND is_active = TRUE LIMIT 1',
      [Number(input)],
    )
    rows = found
  } else {
    const [found] = await pool.execute(
      'SELECT id FROM categories WHERE (slug = ? OR name = ?) AND is_active = TRUE LIMIT 1',
      [String(input), String(input)],
    )
    rows = found
  }
  if (!rows[0]) throw new HttpError(400, 'A valid active category is required')
  return rows[0].id
}

export async function createCategory({ name, slug, description }) {
  const [result] = await pool.execute(
    'INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)',
    [name, slug, description || null],
  )
  return findCategoryById(result.insertId)
}

export async function updateCategory(id, { name, slug, description, isActive }) {
  const fields = []
  const values = []
  const updates = { name, slug, description, is_active: isActive }

  for (const [field, value] of Object.entries(updates)) {
    if (value === undefined) continue
    fields.push(`${field} = ?`)
    values.push(value)
  }
  if (fields.length) {
    values.push(id)
    await pool.execute(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values)
  }
  return findCategoryById(id)
}

export async function deactivateCategory(id) {
  const [result] = await pool.execute('UPDATE categories SET is_active = FALSE WHERE id = ?', [id])
  if (!result.affectedRows) throw new HttpError(404, 'Category not found')
}
