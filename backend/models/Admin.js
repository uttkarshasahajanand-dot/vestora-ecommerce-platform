import { pool } from '../config/database.js'

export async function getDashboardStats() {
  const [rows] = await pool.execute(
    `SELECT
       (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM products) AS totalProducts,
       (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS activeProducts,
       (SELECT COUNT(*) FROM orders) AS totalOrders,
       (SELECT COUNT(*) FROM orders WHERE status = 'pending') AS pendingOrders,
       (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status <> 'cancelled') AS revenue,
       (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND stock_quantity <= 5) AS lowStockProducts,
       (SELECT COUNT(*) FROM orders WHERE status = 'processing') AS processingOrders,
       (SELECT COUNT(*) FROM orders WHERE status = 'shipped') AS shippedOrders,
       (SELECT COUNT(*) FROM orders WHERE status = 'delivered') AS deliveredOrders,
       (SELECT COUNT(*) FROM orders WHERE status = 'cancelled') AS cancelledOrders`,
  )
  const stats = rows[0]
  const [recentOrders] = await pool.execute(
    `SELECT id, order_number AS orderNumber, customer_email AS customerEmail,
            status, total_amount AS total, currency, created_at AS createdAt
     FROM orders ORDER BY created_at DESC LIMIT 5`,
  )
  const [latestUsers] = await pool.execute(
    `SELECT id, name, email, user_role AS role, created_at AS createdAt
     FROM users ORDER BY created_at DESC LIMIT 5`,
  )
  const [bestSellers] = await pool.execute(
    `SELECT oi.product_slug AS productId, oi.product_name AS name,
            SUM(oi.quantity) AS quantitySold,
            SUM(oi.unit_price * oi.quantity) AS grossSales
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE o.status <> 'cancelled'
     GROUP BY oi.product_slug, oi.product_name
     ORDER BY quantitySold DESC, grossSales DESC
     LIMIT 5`,
  )
  return {
    totalUsers: Number(stats.totalUsers),
    totalProducts: Number(stats.totalProducts),
    activeProducts: Number(stats.activeProducts),
    totalOrders: Number(stats.totalOrders),
    pendingOrders: Number(stats.pendingOrders),
    lowStockProducts: Number(stats.lowStockProducts),
    revenue: Number(stats.revenue),
    orderStatuses: {
      pending: Number(stats.pendingOrders),
      processing: Number(stats.processingOrders),
      shipped: Number(stats.shippedOrders),
      delivered: Number(stats.deliveredOrders),
      cancelled: Number(stats.cancelledOrders),
    },
    recentOrders,
    latestUsers,
    bestSellers: bestSellers.map((item) => ({
      ...item,
      quantitySold: Number(item.quantitySold),
      grossSales: Number(item.grossSales),
    })),
  }
}
