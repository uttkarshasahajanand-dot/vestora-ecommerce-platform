import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminDataState from '../../components/admin/AdminDataState.jsx'
import useAdminResource from '../../hooks/useAdminResource.js'
import { formatPrice } from '../../data/products.js'

const statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function AdminOrders() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const query = new URLSearchParams({ page: String(page), limit: '20' })
  if (search) query.set('search', search)
  if (status) query.set('status', status)
  const { data, loading, error, reload } = useAdminResource(`/admin/orders?${query}`)
  const orders = data?.orders ?? []
  const pagination = data?.pagination

  function applySearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div>
      <div className="mb-7">
        <p className="eyebrow">From confirmation to delivery</p>
        <h1 className="section-title text-4xl">Orders.</h1>
        <p className="mt-3 text-sm text-muted">Track each order and its supported fulfillment status.</p>
      </div>
      <section className="mb-5 grid gap-3 border border-ink/10 bg-white/70 p-4 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <form id="order-search-form" onSubmit={applySearch}>
          <label htmlFor="order-search" className="form-label">Search orders</label>
          <input id="order-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="form-input" placeholder="Order number or customer email" />
        </form>
        <div>
          <label htmlFor="order-status" className="form-label">Status</label>
          <select id="order-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1) }} className="form-input">
            <option value="">All statuses</option>
            {statuses.map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}
          </select>
        </div>
        <button type="submit" form="order-search-form" className="min-h-[46px] border border-ink/20 px-4 text-[9px] uppercase tracking-[0.13em] hover:border-gold hover:text-gold">Search</button>
      </section>

      <AdminDataState loading={loading} error={error} onRetry={reload}>
        <div className="border border-ink/10 bg-white/70">
          {orders.length ? (
            <div className="divide-y divide-ink/10">
              {orders.map((order) => (
                <article key={order.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[1fr_1.2fr_auto_auto] sm:items-center sm:px-6">
                  <Link to={`/admin/orders/${order.id}`} className="text-sm hover:text-gold">{order.orderNumber}</Link>
                  <span className="truncate text-xs text-muted">{order.customerEmail}</span>
                  <span className="w-fit border border-ink/15 px-2 py-1 text-[9px] uppercase tracking-[0.1em]">{order.status}</span>
                  <div className="text-left sm:text-right">
                    <span className="block text-sm">{formatPrice(order.total)}</span>
                    <span className="mt-1 block text-[9px] text-muted">{formatDate(order.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="px-6 py-16 text-center text-sm text-muted">No orders match these filters.</p>}
          {pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink/10 px-4 py-4 sm:px-6">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="text-[9px] uppercase tracking-[0.13em] text-muted disabled:opacity-40">Previous</button>
              <span className="text-[10px] text-muted">Page {pagination.page} of {pagination.totalPages}</span>
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="text-[9px] uppercase tracking-[0.13em] text-muted disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </AdminDataState>
    </div>
  )
}