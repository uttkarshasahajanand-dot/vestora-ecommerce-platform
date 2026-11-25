import { useEffect, useState } from 'react'
import { ArrowLeft, PackageCheck } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { formatPrice } from '../data/products.js'
import { fetchMyOrder } from '../services/orders.js'

function formatOrderDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(value))
}

export default function OrderDetails() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    let active = true
    setIsLoading(true)
    setError('')

    fetchMyOrder(orderId, { signal: controller.signal })
      .then((result) => {
        if (active) setOrder(result)
      })
      .catch((requestError) => {
        if (!active || requestError.code === 'REQUEST_ABORTED') return
        setError(requestError.message || 'This order could not be loaded.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [orderId, reloadKey])

  return (
    <section className="mx-auto max-w-[1000px] px-5 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20">
      <Link to="/orders" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted transition hover:text-ink">
        <ArrowLeft size={14} /> My orders
      </Link>
      {isLoading ? (
        <LoadingSpinner label="Loading order details" />
      ) : error ? (
        <div className="mt-10 border border-gold/40 bg-white/70 px-5 py-4 text-sm" role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 border-b border-ink pb-1 text-[10px] uppercase tracking-[0.15em] hover:text-gold">Try again</button>
        </div>
      ) : order ? (
        <>
          <div className="mb-10 mt-6 border-b border-ink/15 pb-7">
            <p className="eyebrow">Order placed {formatOrderDate(order.createdAt)}</p>
            <h1 className="section-title text-4xl sm:text-5xl">{order.orderNumber}</h1>
            <span className="mt-4 inline-flex border border-ink/15 px-2.5 py-1 text-[9px] uppercase tracking-[0.12em] text-muted">{order.status}</span>
          </div>
          <div className="grid gap-10 lg:grid-cols-[1fr_320px] lg:gap-14">
            <div>
              <h2 className="mb-4 font-display text-2xl">Your pieces</h2>
              <div className="divide-y divide-ink/15 border-y border-ink/15">
                {order.items.map((item, index) => (
                  <article key={`${item.id}-${item.size}-${index}`} className="grid grid-cols-[76px_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[96px_1fr_auto] sm:gap-6">
                    <div className="aspect-[4/5] overflow-hidden bg-cream">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm">{item.name}</p>
                      <p className="mt-1 text-xs text-muted">{item.color} · Size: {item.size}</p>
                      <p className="mt-1 text-xs text-muted">Quantity: {item.quantity}</p>
                    </div>
                    <p className="text-right text-sm">{formatPrice(item.price * item.quantity)}</p>
                  </article>
                ))}
              </div>
            </div>
            <aside className="h-fit space-y-7 bg-white/70 p-6 sm:p-8">
              <div>
                <h2 className="font-display text-2xl">Delivery address</h2>
                <address className="mt-4 space-y-1 text-sm not-italic leading-6 text-muted">
                  <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                  <p>{order.shippingAddress.address}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
                  <p>{order.shippingAddress.country}</p>
                </address>
              </div>
              <div className="border-t border-ink/15 pt-5">
                <h2 className="font-display text-2xl">Order summary</h2>
                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{order.shippingAmount === 0 ? 'Complimentary' : formatPrice(order.shippingAmount)}</span></div>
                  <div className="flex justify-between border-t border-ink/15 pt-4 font-medium"><span>Total</span><span>{formatPrice(order.total)}</span></div>
                </div>
                <p className="mt-5 text-xs leading-5 text-muted">Payment has not been processed. Payment processing is not yet available.</p>
              </div>
            </aside>
          </div>
        </>
      ) : (
        <div className="py-16 text-center">
          <PackageCheck size={28} strokeWidth={1.2} className="mx-auto text-gold" />
          <p className="mt-5 text-sm text-muted">Order details are unavailable.</p>
        </div>
      )}
    </section>
  )
}
