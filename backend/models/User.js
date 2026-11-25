import { pool } from '../config/database.js'
import HttpError from '../utils/HttpError.js'

export async function createUser({ name, email, passwordHash }) {
  const [result] = await pool.execute(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
    [name, email, passwordHash],
  )
  return findPublicById(result.insertId)
}

export async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash AS passwordHash, user_role AS role, created_at AS createdAt FROM users WHERE email = ? LIMIT 1',
    [email],
  )
  return rows[0] ?? null
}

export async function findPublicById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, user_role AS role, created_at AS createdAt FROM users WHERE id = ? LIMIT 1',
    [id],
  )
  return rows[0] ?? null
}

export async function updateProfile(id, { name, email }) {
  const fields = []
  const values = []

  if (name !== undefined) {
    fields.push('name = ?')
    values.push(name)
  }
  if (email !== undefined) {
    fields.push('email = ?')
    values.push(email)
  }
  if (!fields.length) return findPublicById(id)

  values.push(id)
  await pool.execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values)
  return findPublicById(id)
}

export async function listUsers({ page, limit, offset, search, role }) {
  const where = []
  const values = []

  if (search) {
    where.push('(name LIKE ? OR email LIKE ?)')
    values.push(`%${search}%`, `%${search}%`)
  }
  if (role) {
    where.push('user_role = ?')
    values.push(role)
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const [rows] = await pool.execute(
    `SELECT id, name, email, user_role AS role, created_at AS createdAt
     FROM users ${whereClause}
     ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  )
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users ${whereClause}`,
    values,
  )
  return { users: rows, total: countRows[0].total, page, limit }
}

export async function updateRole(userId, role, requesterId) {
  if (String(userId) === String(requesterId) && role !== 'admin') {
    throw new HttpError(409, 'You cannot remove your own admin access')
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [users] = await connection.execute(
      'SELECT user_role AS role FROM users WHERE id = ? FOR UPDATE',
      [userId],
    )
    if (!users[0]) throw new HttpError(404, 'User not found')

    if (users[0].role === 'admin' && role === 'customer') {
      const [admins] = await connection.execute(
        'SELECT id FROM users WHERE user_role = ? FOR UPDATE',
        ['admin'],
      )
      if (admins.length <= 1) throw new HttpError(409, 'The last admin cannot be demoted')
    }

    await connection.execute('UPDATE users SET user_role = ? WHERE id = ?', [role, userId])
    await connection.commit()
  } catch (error) {
    try {
      await connection.rollback()
    } catch (rollbackError) {
      console.error('Failed to roll back user role update', rollbackError.code ?? rollbackError.message)
    }
    throw error
  } finally {
    connection.release()
  }

  return findPublicById(userId)
}
