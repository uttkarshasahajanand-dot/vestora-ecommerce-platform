import { ArrowUpRight, CircleDollarSign, PackageCheck, ShoppingBag, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminDataState from '../../components/admin/AdminDataState.jsx'
import useAdminResource from '../../hooks/useAdminResource.js'
import { formatPrice } from '../../data/products.js'

const orderStatuses = [
  ['pending', 'Pending'],
  ['processing', 'Processing'],
  ['shipped', 'Shipped'],
  ['delivered', 'Delivered'],
  ['cancelled', 'Cancelled'],
]

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
}

function Metric({ label, value, icon: Icon, detail }) {
  return (
    <article className="admin-metric border border-ink/10 bg-white/70 p-5 sm:p-6">
      <div className="flex items-start justify-between">
        <p className="text-[9px] uppercase tracking-[0.16em] text-muted">{label}</p>
        <span className="admin-metric-icon flex h-9 w-9 items-center justify-center">
          <Icon size={17} strokeWidth={1.5} />
        </span>
      </div>
      <p className="mt-5 font-display text-3xl">{value}</p>
      {detail && <p className="mt-2 text-[10px] text-muted">{detail}</p>}
    </article>
  )
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAdminResource('/admin/dashboard')
  const stats = data?.stats

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The VESTORA atelier</p>
          <h1 className="section-title text-4xl">Overview.</h1>
          <p className="mt-3 text-sm text-muted">A considered view of your store.</p>
        </div>
        <Link to="/admin/products" className="inline-flex items-center gap-2 border-b border-ink pb-2 text-[9px] uppercase tracking-[0.15em] hover:text-gold">Manage collection <ArrowUpRight size={14} /></Link>
      </div>

      <AdminDataState loading={loading} error={error} onRetry={reload}>
        {stats && (
          <div className="space-y-8">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Total products" value={stats.totalProducts} detail={`${stats.activeProducts} currently active`} icon={ShoppingBag} />
              <Metric label="Registered users" value={stats.totalUsers} icon={UsersRound} />
              <Metric label="Orders placed" value={stats.totalOrders} detail={`${stats.pendingOrders} pending`} icon={PackageCheck} />
              <Metric label="Gross order revenue" value={formatPrice(stats.revenue)} detail="Non-cancelled order totals · not payment-settled" icon={CircleDollarSign} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
              <div className="border border-ink/10 bg-white/70">
                <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4 sm:px-6">
                  <div>
                    <p className="eyebrow">The latest</p>
                    <h2 className="font-display text-2xl">Recent orders</h2>
                  </div>
                  <Link to="/admin/orders" className="text-[9px] uppercase tracking-[0.14em] text-muted hover:text-gold">All orders</Link>
                </div>
                <div className="divide-y divide-ink/10">
                  {stats.recentOrders?.length ? stats.recentOrders.map((order) => (
                    <Link key={order.id} to={`/admin/orders/${order.id}`} className="grid grid-cols-[1fr_auto] gap-3 px-5 py-4 text-xs transition hover:bg-cream/60 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-center sm:px-6">
                      <span className="font-medium">{order.orderNumber}</span>
                      <span className="hidden text-muted sm:block">{order.customerEmail}</span>
                      <span className="text-muted">{order.status}</span>
                      <span className="text-right">{formatPrice(order.total)}</span>
                    </Link>
                  )) : <p className="px-6 py-10 text-center text-sm text-muted">No orders have been placed yet.</p>}
                </div>
              </div>

              <div className="border border-ink/10 bg-white/70">
                <div className="border-b border-ink/10 px-5 py-4 sm:px-6">
                  <p className="eyebrow">Order flow</p>
                  <h2 className="font-display text-2xl">Status overview</h2>
                </div>
                <div className="space-y-4 p-5 sm:p-6">
                  {orderStatuses.map(([key, label]) => {
                    const count = Number(stats.orderStatuses?.[key] ?? 0)
                    const total = Number(stats.totalOrders)
                    const percentage = Number.isFinite(count) && total > 0
                      ? Math.min(100, Math.max(0, (count / total) * 100))
                      : 0

                    return (
                      <div key={key} className="admin-chart-row text-xs">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted">{label}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="admin-chart-track" role="img" aria-label={`${label}: ${count} orders`}>
                          <span style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    )
                  })}
                  <div className="border-t border-ink/10 pt-4 text-xs">
                    <span className="text-muted">Low-stock products (5 or fewer)</span>
                    <span className="float-right font-medium">{stats.lowStockProducts}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <div className="border border-ink/10 bg-white/70">
                <div className="border-b border-ink/10 px-5 py-4 sm:px-6">
                  <p className="eyebrow">Recently joined</p>
                  <h2 className="font-display text-2xl">Latest users</h2>
                </div>
                <div className="divide-y divide-ink/10">
                  {stats.latestUsers?.length ? stats.latestUsers.map((user) => (
                    <Link key={user.id} to="/admin/users" className="flex items-center justify-between gap-3 px-5 py-4 text-xs hover:bg-cream/60 sm:px-6">
                      <span><span className="block font-medium">{user.name}</span><span className="mt-1 block text-muted">{user.email}</span></span>
                      <span className="text-right text-muted">{formatDate(user.createdAt)}<span className="mt-1 block uppercase tracking-[0.1em]">{user.role}</span></span>
                    </Link>
                  )) : <p className="px-6 py-10 text-center text-sm text-muted">No registered users yet.</p>}
                </div>
              </div>

              <div className="border border-ink/10 bg-white/70">
                <div className="border-b border-ink/10 px-5 py-4 sm:px-6">
                  <p className="eyebrow">From completed order history</p>
                  <h2 className="font-display text-2xl">Best sellers</h2>
                </div>
                <div className="divide-y divide-ink/10">
                  {stats.bestSellers?.length ? stats.bestSellers.map((product) => (
                    <div key={product.productId} className="flex items-center justify-between gap-4 px-5 py-4 text-xs sm:px-6">
                      <span className="font-medium">{product.name}</span>
                      <span className="text-right text-muted">{product.quantitySold} sold · {formatPrice(product.grossSales)}</span>
                    </div>
                  )) : <p className="px-6 py-10 text-center text-sm text-muted">Sales history will appear here after orders are placed.</p>}
                </div>
              </div>
            </section>
          </div>
        )}
      </AdminDataState>
    </div>
  )
}