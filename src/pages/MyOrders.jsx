import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { formatPrice } from '../data/products.js'
import { fetchMyOrders } from '../services/orders.js'

function formatOrderDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

export default function MyOrders() {
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setIsLoading(true)
    setError('')

    fetchMyOrders({ page, signal: controller.signal })
      .then((result) => {
        if (!active) return
        setOrders(result.orders)
        setPagination(result.pagination)
      })
      .catch((requestError) => {
        if (!active || requestError.code === 'REQUEST_ABORTED') return
        setError(requestError.message || 'Your order history could not be loaded.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [page, reloadKey])

  const retry = useCallback(() => setReloadKey((key) => key + 1), [])

  return (
    <section className="mx-auto max-w-[1000px] px-5 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20">
      <Link to="/" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted transition hover:text-ink">
        <ArrowLeft size={14} /> Continue browsing
      </Link>
      <div className="mb-10 mt-6 border-b border-ink/15 pb-7 sm:mb-12">
        <p className="eyebrow">Considered pieces, kept for you</p>
        <h1 className="section-title text-4xl sm:text-5xl">My orders</h1>
      </div>

      {error && (
        <div className="mb-8 border border-gold/40 bg-white/70 px-5 py-4 text-sm" role="alert">
          <p>{error}</p>
          <button type="button" onClick={retry} className="mt-3 border-b border-ink pb-1 text-[10px] uppercase tracking-[0.15em] hover:text-gold">Try again</button>
        </div>
      )}
      {isLoading ? (
        <LoadingSpinner label="Loading your orders" />
      ) : error ? null : orders.length === 0 ? (
        <div className="py-16 text-center sm:py-24">
          <Package size={28} strokeWidth={1.2} className="mx-auto text-gold" />
          <p className="mt-5 font-display text-3xl">Nothing ordered just yet.</p>
          <p className="mt-3 text-sm text-muted">Your considered choices will be gathered here.</p>
          <Link to="/collections" className="mt-7 inline-flex bg-ink px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-ivory transition hover:bg-gold">Discover the collection</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="border border-ink/10 bg-white/60 p-5 sm:p-7">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.16em] text-muted">{formatOrderDate(order.createdAt)}</p>
                    <h2 className="mt-2 font-display text-xl">{order.orderNumber}</h2>
                    <span className="mt-3 inline-flex border border-ink/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-muted">{order.status}</span>
                  </div>
                  <div className="flex items-center justify-between gap-5 sm:justify-end">
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted">Order total</p>
                      <p className="mt-1 text-sm">{formatPrice(order.total)}</p>
                    </div>
                    <Link to={`/orders/${order.id}`} className="inline-flex items-center gap-2 border-b border-ink pb-1 text-[9px] uppercase tracking-[0.14em] transition hover:text-gold">
                      View details <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {pagination && pagination.totalPages > 1 && (
            <nav aria-label="Order history pages" className="mt-9 flex items-center justify-between border-t border-ink/15 pt-5">
              <button type="button" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)} className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-muted hover:text-ink disabled:opacity-40">
                <ArrowLeft size={13} /> Previous
              </button>
              <span className="text-[10px] text-muted">Page {pagination.page} of {pagination.totalPages}</span>
              <button type="button" disabled={page >= pagination.totalPages || isLoading} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-2 text-[9px] uppercase tracking-[0.14em] text-muted hover:text-ink disabled:opacity-40">
                Next <ArrowRight size={13} />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  )
}
