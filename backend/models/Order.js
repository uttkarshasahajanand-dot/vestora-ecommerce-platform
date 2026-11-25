import { randomBytes } from 'node:crypto'
import { pool } from '../config/database.js'
import HttpError from '../utils/HttpError.js'

const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

function createOrderNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const suffix = randomBytes(4).toString('hex').toUpperCase()
  return `VST-${stamp}-${suffix}`
}

export async function placeOrder(userId, shippingAddress) {
  const connection = await pool.getConnection()
  let orderId

  try {
    await connection.beginTransaction()

    const [users] = await connection.execute(
      'SELECT email FROM users WHERE id = ? LIMIT 1 FOR UPDATE',
      [userId],
    )
    if (!users[0]) throw new HttpError(404, 'User not found')

    const [carts] = await connection.execute(
      'SELECT id FROM carts WHERE user_id = ? LIMIT 1 FOR UPDATE',
      [userId],
    )
    if (!carts[0]) throw new HttpError(400, 'Your cart is empty')

    const [items] = await connection.execute(
      `SELECT ci.product_id AS productId, ci.size, ci.quantity,
              p.slug AS productSlug, p.name AS productName, p.image_url AS productImage,
              p.color AS productColor, p.price, p.stock_quantity AS stockQuantity,
              p.is_active AS isActive, c.is_active AS categoryIsActive
       FROM cart_items ci
       INNER JOIN products p ON p.id = ci.product_id
       INNER JOIN categories c ON c.id = p.category_id
       WHERE ci.cart_id = ?
       FOR UPDATE`,
      [carts[0].id],
    )
    if (!items.length) throw new HttpError(400, 'Your cart is empty')

    for (const item of items) {
      if (!item.isActive || !item.categoryIsActive) {
        throw new HttpError(409, `${item.productName} is no longer available`)
      }
      if (item.quantity > item.stockQuantity) {
        throw new HttpError(409, `Not enough inventory for ${item.productName}`)
      }
    }

    const subtotalCents = items.reduce(
      (total, item) => total + Math.round(Number(item.price) * 100) * item.quantity,
      0,
    )
    const shippingCents = subtotalCents >= 50000 ? 0 : 1500
    const subtotal = subtotalCents / 100
    const shippingAmount = shippingCents / 100
    const total = (subtotalCents + shippingCents) / 100

    const [orderResult] = await connection.execute(
      `INSERT INTO orders
         (order_number, user_id, customer_email, subtotal, shipping_amount, total_amount, shipping_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        createOrderNumber(),
        userId,
        users[0].email,
        subtotal,
        shippingAmount,
        total,
        JSON.stringify(shippingAddress),
      ],
    )
    orderId = orderResult.insertId

    for (const item of items) {
      const [inventoryResult] = await connection.execute(
        `UPDATE products SET stock_quantity = stock_quantity - ?
         WHERE id = ? AND is_active = TRUE AND stock_quantity >= ?`,
        [item.quantity, item.productId, item.quantity],
      )
      if (inventoryResult.affectedRows !== 1) {
        throw new HttpError(409, `Inventory changed while placing your order for ${item.productName}`)
      }

      await connection.execute(
        `INSERT INTO order_items
           (order_id, product_id, product_slug, product_name, product_image,
            product_color, unit_price, size, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          item.productId,
          item.productSlug,
          item.productName,
          item.productImage,
          item.productColor,
          item.price,
          item.size,
          item.quantity,
        ],
      )
    }

    await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [carts[0].id])
    await connection.commit()
  } catch (error) {
    try {
      await connection.rollback()
    } catch (rollbackError) {
      console.error('Failed to roll back order transaction', rollbackError.code ?? rollbackError.message)
    }
    throw error
  } finally {
    connection.release()
  }

  return findOrderForUser(userId, orderId)
}

async function fetchOrder(orderId) {
  const [orders] = await pool.execute(
    `SELECT o.id, o.order_number AS orderNumber, o.user_id AS userId,
            o.customer_email AS customerEmail, o.status, o.subtotal,
            o.shipping_amount AS shippingAmount, o.total_amount AS total,
            o.currency, o.shipping_address AS shippingAddress,
            o.created_at AS createdAt, o.updated_at AS updatedAt
     FROM orders o WHERE o.id = ? LIMIT 1`,
    [orderId],
  )
  if (!orders[0]) return null

  const [items] = await pool.execute(
    `SELECT product_id AS productId, product_slug AS id, product_name AS name,
            product_image AS image, product_color AS color, unit_price AS price,
            size, quantity
     FROM order_items WHERE order_id = ? ORDER BY id`,
    [orderId],
  )
  return { ...orders[0], items }
}

export async function findOrderById(orderId) {
  return fetchOrder(orderId)
}

export async function findOrderForUser(userId, orderId) {
  const order = await fetchOrder(orderId)
  if (!order || String(order.userId) !== String(userId)) return null
  return order
}

export async function listUserOrders(userId, { page, limit, offset }) {
  const [rows] = await pool.execute(
    `SELECT id, order_number AS orderNumber, status, subtotal,
            shipping_amount AS shippingAmount, total_amount AS total, currency,
            created_at AS createdAt
     FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset],
  )
  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [userId])
  return { orders: rows, total: countRows[0].total, page, limit }
}

export async function listAllOrders({ page, limit, offset, status, search }) {
  const filters = []
  const values = []
  if (status) {
    filters.push('status = ?')
    values.push(status)
  }
  if (search) {
    filters.push('(order_number LIKE ? OR customer_email LIKE ? OR CAST(id AS CHAR) = ?)')
    values.push(`%${search}%`, `%${search}%`, search)
  }
  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const [rows] = await pool.execute(
    `SELECT id, order_number AS orderNumber, user_id AS userId,
            customer_email AS customerEmail, status, subtotal,
            shipping_amount AS shippingAmount, total_amount AS total, currency,
            created_at AS createdAt
     FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  )
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total FROM orders ${where}`,
    values,
  )
  return { orders: rows, total: countRows[0].total, page, limit }
}

export async function updateOrderStatus(orderId, status) {
  if (!orderStatuses.includes(status)) throw new HttpError(400, 'Invalid order status')

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [orders] = await connection.execute(
      'SELECT status FROM orders WHERE id = ? FOR UPDATE',
      [orderId],
    )
    const order = orders[0]
    if (!order) throw new HttpError(404, 'Order not found')
    if (order.status === status) {
      await connection.commit()
    } else {
      const allowedTransitions = {
        pending: ['processing', 'cancelled'],
        processing: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: [],
        cancelled: [],
      }
      if (!allowedTransitions[order.status].includes(status)) {
        throw new HttpError(409, `Cannot change an order from ${order.status} to ${status}`)
      }

      if (status === 'cancelled') {
        const [items] = await connection.execute(
          'SELECT product_id AS productId, quantity FROM order_items WHERE order_id = ? FOR UPDATE',
          [orderId],
        )
        for (const item of items) {
          if (item.productId) {
            await connection.execute(
              'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
              [item.quantity, item.productId],
            )
          }
        }
      }

      await connection.execute('UPDATE orders SET status = ? WHERE id = ?', [status, orderId])
      await connection.commit()
    }
  } catch (error) {
    try {
      await connection.rollback()
    } catch (rollbackError) {
      console.error('Failed to roll back order status update', rollbackError.code ?? rollbackError.message)
    }
    throw error
  } finally {
    connection.release()
  }
  return fetchOrder(orderId)
}
