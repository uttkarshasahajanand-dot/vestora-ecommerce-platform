import { pool } from '../config/database.js'
import HttpError from '../utils/HttpError.js'
import { hashCartMutation, normalizeMergeItems } from '../utils/cart.js'

async function findCartId(userId, connection = pool, create = false, lock = false) {
  if (create) {
    await connection.execute(
      'INSERT INTO carts (user_id) VALUES (?) ON DUPLICATE KEY UPDATE id = LAST_INSERT_ID(id)',
      [userId],
    )
  }
  const [rows] = await connection.execute(
    `SELECT id FROM carts WHERE user_id = ? LIMIT 1${lock ? ' FOR UPDATE' : ''}`,
    [userId],
  )
  return rows[0]?.id ?? null
}

export async function getCart(userId) {
  const cartId = await findCartId(userId)
  if (!cartId) return { items: [], itemCount: 0, subtotal: 0 }

  const [items] = await pool.execute(
    `SELECT p.slug AS id, p.name, c.name AS category, p.price, p.color,
            p.image_url AS image, p.description, p.label,
            ci.size, ci.quantity, p.stock_quantity AS stockQuantity
     FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id
     INNER JOIN categories c ON c.id = p.category_id
     WHERE ci.cart_id = ? AND p.is_active = TRUE AND c.is_active = TRUE
     ORDER BY ci.created_at ASC`,
    [cartId],
  )

  const subtotalCents = items.reduce(
    (total, item) => total + Math.round(Number(item.price) * 100) * item.quantity,
    0,
  )
  return {
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    subtotal: subtotalCents / 100,
  }
}

async function addLine(connection, cartId, { productId, size, quantity }) {
  const [products] = await connection.execute(
    `SELECT p.id, p.stock_quantity AS stockQuantity
     FROM products p
     INNER JOIN categories c ON c.id = p.category_id
     WHERE p.slug = ? AND p.is_active = TRUE AND c.is_active = TRUE
     FOR UPDATE`,
    [productId],
  )
  const product = products[0]
  if (!product) throw new HttpError(404, 'Product not found')
  if (product.stockQuantity < 1) throw new HttpError(409, 'This product is out of stock')

  const [existingRows] = await connection.execute(
    'SELECT quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND size = ? FOR UPDATE',
    [cartId, product.id, size],
  )
  const nextQuantity = (existingRows[0]?.quantity ?? 0) + quantity
  if (nextQuantity > product.stockQuantity) {
    throw new HttpError(409, `Only ${product.stockQuantity} item(s) are currently available`)
  }

  await connection.execute(
    `INSERT INTO cart_items (cart_id, product_id, size, quantity)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
    [cartId, product.id, size, nextQuantity],
  )
}

async function runIdempotentMutation(userId, idempotencyKey, operation, items) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const cartId = await findCartId(userId, connection, true, true)
    const payloadHash = hashCartMutation(operation, items)
    const [existingKeys] = await connection.execute(
      `SELECT operation, payload_hash AS payloadHash
       FROM cart_idempotency_keys
       WHERE user_id = ? AND idempotency_key = ?
       FOR UPDATE`,
      [userId, idempotencyKey],
    )

    if (existingKeys[0]) {
      if (existingKeys[0].operation !== operation || existingKeys[0].payloadHash !== payloadHash) {
        throw new HttpError(409, 'This Idempotency-Key was already used for a different cart request')
      }
      await connection.commit()
    } else {
      for (const item of items) {
        await addLine(connection, cartId, item)
      }
      await connection.execute(
        `INSERT INTO cart_idempotency_keys (user_id, idempotency_key, operation, payload_hash)
         VALUES (?, ?, ?, ?)`,
        [userId, idempotencyKey, operation, payloadHash],
      )
      await connection.commit()
    }
  } catch (error) {
    try {
      await connection.rollback()
    } catch (rollbackError) {
      console.error('Failed to roll back cart update', rollbackError.code ?? rollbackError.message)
    }
    throw error
  } finally {
    connection.release()
  }

  return getCart(userId)
}

export async function addItem(userId, item, idempotencyKey) {
  return runIdempotentMutation(userId, idempotencyKey, 'add', [item])
}

export async function mergeItems(userId, guestItems, idempotencyKey) {
  const items = normalizeMergeItems(guestItems)
  return runIdempotentMutation(userId, idempotencyKey, 'merge', items)
}

export async function updateItem(userId, productSlug, size, quantity) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const cartId = await findCartId(userId, connection, false, true)
    if (!cartId) throw new HttpError(404, 'Cart item not found')

    const [rows] = await connection.execute(
      `SELECT ci.id, p.stock_quantity AS stockQuantity
       FROM cart_items ci
       INNER JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = ? AND p.slug = ? AND ci.size = ?
       FOR UPDATE`,
      [cartId, productSlug, size],
    )
    if (!rows[0]) throw new HttpError(404, 'Cart item not found')
    if (quantity > rows[0].stockQuantity) {
      throw new HttpError(409, `Only ${rows[0].stockQuantity} item(s) are currently available`)
    }

    await connection.execute('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, rows[0].id])
    await connection.commit()
  } catch (error) {
    try {
      await connection.rollback()
    } catch (rollbackError) {
      console.error('Failed to roll back cart update', rollbackError.code ?? rollbackError.message)
    }
    throw error
  } finally {
    connection.release()
  }
  return getCart(userId)
}

export async function removeItem(userId, productSlug, size) {
  const cartId = await findCartId(userId)
  if (!cartId) return getCart(userId)

  await pool.execute(
    `DELETE ci FROM cart_items ci
     INNER JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = ? AND p.slug = ? AND ci.size = ?`,
    [cartId, productSlug, size],
  )
  return getCart(userId)
}
