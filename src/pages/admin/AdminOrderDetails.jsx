import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminDataState from '../../components/admin/AdminDataState.jsx'
import useAdminResource from '../../hooks/useAdminResource.js'
import api from '../../services/api.js'
import { formatPrice } from '../../data/products.js'

const transitions = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(value))
}

export default function AdminOrderDetails() {
  const { orderId } = useParams()
  const [actionError, setActionError] = useState('')
  const [saving, setSaving] = useState(false)
  const { data, loading, error, reload } = useAdminResource(`/admin/orders/${encodeURIComponent(orderId)}`)
  const order = data?.order

  async function updateStatus(status) {
    const message = status === 'cancelled'
      ? 'Cancel this order? Inventory will be restored by the backend.'
      : `Advance this order to ${status}?`
    if (!window.confirm(message)) return
    setActionError('')
    setSaving(true)
    try {
      await api.patch(`/admin/orders/${encodeURIComponent(orderId)}/status`, { status })
      reload()
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  const shipping = order?.shippingAddress || {}

  return (
    <div>
      <div className="mb-7">
        <Link to="/admin/orders" className="text-[9px] uppercase tracking-[0.14em] text-muted hover:text-ink">← Back to orders</Link>
      </div>
      <AdminDataState loading={loading} error={error} onRetry={reload}>
        {order && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Order details</p>
                <h1 className="section-title text-4xl">{order.orderNumber}</h1>
                <p className="mt-3 text-xs text-muted">Placed {formatDate(order.createdAt)}</p>
              </div>
              <span className="border border-ink/20 px-4 py-2 text-[10px] uppercase tracking-[0.14em]">{order.status}</span>
            </div>

            {actionError && <p className="border border-red-800/20 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</p>}
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <section className="border border-ink/10 bg-white/70">
                <div className="border-b border-ink/10 px-5 py-4 sm:px-6">
                  <p className="eyebrow">Order contents</p>
                  <h2 className="font-display text-2xl">Pieces ordered</h2>
                </div>
                <div className="divide-y divide-ink/10">
                  {order.items.map((item) => (
                    <article key={`${item.id}-${item.size}`} className="grid grid-cols-[64px_1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[76px_1fr_auto] sm:px-6">
                      <img src={item.image} alt="" className="h-20 w-16 bg-cream object-cover" />
                      <div>
                        <p className="text-sm">{item.name}</p>
                        <p className="mt-1 text-xs text-muted">{item.color} · Size {item.size}</p>
                        <p className="mt-1 text-xs text-muted">Quantity {item.quantity} · {formatPrice(item.price)} each</p>
                      </div>
                      <p className="text-right text-sm">{formatPrice(Number(item.price) * Number(item.quantity))}</p>
                    </article>
                  ))}
                </div>
              </section>

              <aside className="space-y-5">
                <section className="border border-ink/10 bg-white/70 p-5 sm:p-6">
                  <p className="eyebrow">Customer</p>
                  <h2 className="font-display text-xl">{order.customerEmail}</h2>
                  <p className="mt-2 text-xs text-muted">Account #{order.userId}</p>
                  <div className="mt-5 border-t border-ink/10 pt-4">
                    <p className="text-[9px] uppercase tracking-[0.14em] text-muted">Shipping address</p>
                    <address className="mt-3 space-y-1 text-xs not-italic leading-5">
                      <p>{shipping.firstName} {shipping.lastName}</p>
                      <p>{shipping.address}</p>
                      <p>{shipping.city}, {shipping.postalCode}</p>
                      <p>{shipping.country}</p>
                    </address>
                  </div>
                </section>
                <section className="border border-ink/10 bg-white/70 p-5 sm:p-6">
                  <p className="eyebrow">Order summary</p>
                  <div className="mt-4 space-y-3 border-b border-ink/10 pb-4 text-xs">
                    <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{Number(order.shippingAmount) === 0 ? 'Complimentary' : formatPrice(order.shippingAmount)}</span></div>
                    <div className="flex justify-between font-medium"><span>Total ({order.currency})</span><span>{formatPrice(order.total)}</span></div>
                  </div>
                  <p className="mt-4 text-[10px] leading-5 text-muted">The backend does not process payments. This order total is not evidence of payment.</p>
                  {transitions[order.status]?.length > 0 && (
                    <div className="mt-5 space-y-2 border-t border-ink/10 pt-4">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-muted">Allowed next status</p>
                      {transitions[order.status].map((status) => (
                        <button key={status} type="button" disabled={saving} onClick={() => updateStatus(status)} className={`w-full px-4 py-3 text-[9px] uppercase tracking-[0.13em] disabled:opacity-50 ${status === 'cancelled' ? 'border border-ink/20 text-ink hover:border-red-700 hover:text-red-700' : 'bg-ink text-ivory hover:bg-gold'}`}>{saving ? 'Updating…' : status === 'cancelled' ? 'Cancel order' : `Mark ${status}`}</button>
                      ))}
                    </div>
                  )}
                </section>
              </aside>
            </div>
          </div>
        )}
      </AdminDataState>
    </div>
  )
}
