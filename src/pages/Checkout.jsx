import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../data/products.js'
import { createOrder } from '../services/orders.js'

const addressFields = [
  ['firstName', 'First name', 'given-name', 100],
  ['lastName', 'Last name', 'family-name', 100],
  ['address', 'Street address', 'street-address', 255],
  ['city', 'City', 'address-level2', 100],
  ['postalCode', 'Postal code', 'postal-code', 30],
]

function getShippingAddress(formData) {
  return {
    firstName: String(formData.get('firstName') || '').trim(),
    lastName: String(formData.get('lastName') || '').trim(),
    address: String(formData.get('address') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    postalCode: String(formData.get('postalCode') || '').trim(),
    country: String(formData.get('country') || '').trim(),
  }
}

function isValidShippingAddress(address) {
  return address.firstName.length >= 1
    && address.firstName.length <= 100
    && address.lastName.length >= 1
    && address.lastName.length <= 100
    && address.address.length >= 3
    && address.address.length <= 255
    && address.city.length >= 1
    && address.city.length <= 100
    && address.postalCode.length >= 1
    && address.postalCode.length <= 30
    && address.country.length >= 2
    && address.country.length <= 100
}

export default function Checkout() {
  const { user, isLoading: authLoading } = useAuth()
  const {
    items,
    subtotal,
    isLoading: cartLoading,
    isMutating,
    error: cartError,
    canRetry,
    retry,
    refreshCart,
  } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState(null)
  const submissionLock = useRef(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submissionLock.current || isSubmitting) return

    const form = event.currentTarget
    const shippingAddress = getShippingAddress(new FormData(form))
    if (!isValidShippingAddress(shippingAddress)) {
      setError('Please check each shipping field and enter a complete address.')
      return
    }

    submissionLock.current = true
    setIsSubmitting(true)
    setError('')
    try {
      const createdOrder = await createOrder(shippingAddress)
      setOrder(createdOrder)
      refreshCart()
    } catch (requestError) {
      setError(requestError.message || 'Your order could not be placed. Please try again.')
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
  }

  if (order) {
    return (
      <section className="mx-auto max-w-[760px] px-5 py-14 sm:px-10 sm:py-20">
        <div className="bg-white/70 px-6 py-10 text-center sm:px-12 sm:py-14">
          <Check size={30} strokeWidth={1.4} className="mx-auto text-gold" />
          <p className="eyebrow mt-5">Your order is confirmed</p>
          <h1 className="section-title text-4xl sm:text-5xl">Thank you.</h1>
          <p className="mt-4 text-sm leading-6 text-muted">Order <span className="font-medium text-ink">{order.orderNumber}</span> has been recorded.</p>
          <p className="mt-2 text-xs leading-5 text-muted">Payment has not been processed. Payment processing is not yet available.</p>

          <div className="mt-9 border-y border-ink/15 py-6 text-left">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl">Order details</h2>
              <span className="text-[9px] uppercase tracking-[0.14em] text-muted">{order.status}</span>
            </div>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={`${item.id}-${item.size}-${index}`} className="flex justify-between gap-4 text-sm">
                  <span className="text-muted">{item.name} · {item.size} × {item.quantity}</span>
                  <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-3 border-t border-ink/10 pt-5 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(order.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{order.shippingAmount === 0 ? 'Complimentary' : formatPrice(order.shippingAmount)}</span></div>
              <div className="flex justify-between font-medium"><span>Total</span><span>{formatPrice(order.total)}</span></div>
            </div>
            <address className="mt-6 border-t border-ink/10 pt-5 text-left text-xs not-italic leading-5 text-muted">
              <span className="block text-[9px] uppercase tracking-[0.14em]">Delivering to</span>
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
            </address>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link to={`/orders/${order.id}`} className="inline-flex items-center justify-center gap-2 bg-ink px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-ivory transition hover:bg-gold">
              View order <ArrowRight size={14} />
            </Link>
            <Link to="/collections" className="inline-flex items-center justify-center border border-ink/20 px-6 py-4 text-[10px] uppercase tracking-[0.15em] transition hover:border-gold hover:text-gold">Continue browsing</Link>
          </div>
        </div>
      </section>
    )
  }

  if (authLoading || cartLoading) return <LoadingSpinner label="Preparing your order" />

  if (!user) {
    return (
      <section className="mx-auto max-w-[620px] px-6 py-20 text-center sm:py-28">
        <p className="eyebrow">A personal order</p>
        <h1 className="section-title text-4xl">Sign in to continue</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Your bag will be saved and brought together with your account after you sign in.</p>
        <Link to="/login" state={{ from: { pathname: '/checkout' } }} className="mt-7 inline-flex items-center gap-2 bg-ink px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-ivory transition hover:bg-gold">
          Sign in <ArrowRight size={14} />
        </Link>
      </section>
    )
  }

  if (cartError) {
    return (
      <section className="mx-auto max-w-[620px] px-6 py-20 text-center sm:py-28">
        <p className="eyebrow">Your bag needs attention</p>
        <h1 className="section-title text-4xl">We couldn’t confirm your bag.</h1>
        <p className="mt-4 text-sm leading-6 text-muted" role="alert">{cartError}</p>
        {canRetry && <button type="button" onClick={retry} className="mt-7 border-b border-ink pb-1 text-[10px] uppercase tracking-[0.15em] hover:text-gold">Retry</button>}
        <Link to="/cart" className="mt-5 block text-xs text-muted underline underline-offset-4">Return to your bag</Link>
      </section>
    )
  }

  if (!items.length) {
    return (
      <section className="mx-auto max-w-[620px] px-6 py-20 text-center sm:py-28">
        <p className="eyebrow">Your bag is ready when you are</p>
        <h1 className="section-title text-4xl">Nothing to check out yet.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">Explore the collection and add something considered to your bag.</p>
        <Link to="/collections" className="mt-7 inline-flex bg-ink px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-ivory transition hover:bg-gold">Discover the collection</Link>
      </section>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20">
      <Link to="/cart" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted hover:text-ink"><ArrowLeft size={14} /> Return to bag</Link>
      <div className="mb-9 mt-5 border-b border-ink/15 pb-7">
        <p className="eyebrow">Almost yours</p>
        <h1 className="section-title text-4xl sm:text-5xl">Checkout</h1>
      </div>
      <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
        <form onSubmit={handleSubmit} className="space-y-10">
          <section>
            <h2 className="font-display text-2xl">Contact</h2>
            <div className="mt-5 border border-ink/10 bg-white/50 px-4 py-3">
              <p className="form-label">Order email</p>
              <p className="text-sm">{user.email}</p>
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl">Delivery address</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {addressFields.map(([name, label, autoComplete, maxLength]) => (
                <div key={name} className={name === 'address' ? 'sm:col-span-2' : ''}>
                  <label htmlFor={`checkout-${name}`} className="form-label">{label}</label>
                  <input id={`checkout-${name}`} name={name} className="form-input" autoComplete={autoComplete} maxLength={maxLength} required disabled={isSubmitting} />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label htmlFor="checkout-country" className="form-label">Country / region</label>
                <select id="checkout-country" name="country" className="form-input" defaultValue="" required disabled={isSubmitting}>
                  <option value="" disabled>Select a country</option>
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                  <option>Australia</option>
                </select>
              </div>
            </div>
          </section>
          <section>
            <h2 className="font-display text-2xl">Payment</h2>
            <div className="mt-5 border border-ink/15 bg-white/50 p-4 text-sm leading-6 text-muted">Payment processing is not yet available. No payment details are collected; placing this order records it and deducts the items from available inventory.</div>
          </section>
          {error && <p className="border border-red-900/15 bg-white/70 p-3 text-xs leading-5 text-red-900" role="alert">{error}</p>}
          <button type="submit" disabled={isSubmitting || isMutating} className="w-full bg-ink px-6 py-4 text-[10px] uppercase tracking-[0.16em] text-ivory transition hover:bg-gold disabled:cursor-wait disabled:opacity-60">
            {isSubmitting ? 'Placing your order…' : 'Place order · Payment not collected'}
          </button>
        </form>
        <aside className="h-fit bg-white/70 p-6 sm:p-8">
          <h2 className="font-display text-2xl">Your pieces</h2>
          <div className="mt-6 space-y-4 border-b border-ink/15 pb-5">
            {items.map((item) => (
              <div key={`${item.id}-${item.size}`} className="flex gap-4">
                <div className="relative h-20 w-16 shrink-0 bg-cream">
                  <img src={item.image} alt="" className="h-full w-full object-cover" />
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[10px] text-white">{item.quantity}</span>
                </div>
                <div className="flex flex-1 justify-between gap-2 text-xs">
                  <div><p>{item.name}</p><p className="mt-1 text-muted">Size: {item.size}</p></div>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <p className="border-t border-ink/15 pt-4 text-xs leading-5 text-muted">Shipping and final total are calculated by VESTORA when your order is placed.</p>
          </div>
        </aside>
      </div>
    </div>
  )
}
