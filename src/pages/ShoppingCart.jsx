import { ArrowRight, Minus, Plus, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../data/products.js'

export default function ShoppingCart() {
  const {
    items,
    subtotal,
    isLoading,
    isMutating,
    error,
    canRetry,
    mergeFailed,
    retry,
    updateQuantity,
    removeFromCart,
  } = useCart()
  const shipping = subtotal === 0 || subtotal >= 500 ? 0 : 15

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20">
      <div className="mb-10 border-b border-ink/15 pb-7 sm:mb-12">
        <p className="eyebrow">Your considered choices</p>
        <h1 className="section-title text-4xl sm:text-5xl">Shopping bag</h1>
      </div>
      {error && (
        <div className="mb-8 border border-gold/40 bg-white/70 px-5 py-4 text-sm" role="alert">
          <p className="text-ink">{error}</p>
          {mergeFailed && <p className="mt-2 text-xs leading-5 text-muted">Your guest bag is still saved in this browser. You can adjust it here and retry the merge.</p>}
          {canRetry && <button type="button" onClick={retry} disabled={isMutating} className="mt-3 border-b border-ink pb-1 text-[10px] uppercase tracking-[0.15em] hover:text-gold disabled:opacity-50">Retry</button>}
        </div>
      )}
      {isLoading ? (
        <LoadingSpinner label="Loading your bag" />
      ) : error && items.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted" role="status">Your bag could not be confirmed yet. Retry above before continuing.</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center sm:py-24">
          <p className="font-display text-3xl">Your bag is taking a moment.</p>
          <p className="mt-3 text-sm text-muted">It’s a good time to find something you’ll keep.</p>
          <Link to="/collections" className="mt-7 inline-flex items-center gap-2 bg-ink px-6 py-4 text-[10px] uppercase tracking-[0.15em] text-ivory transition hover:bg-gold">Discover the collection <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <div className="grid gap-12 lg:grid-cols-[1fr_340px] lg:gap-16">
          <div>
            <div className="hidden grid-cols-[1fr_130px_100px] border-b border-ink/15 pb-3 text-[9px] uppercase tracking-[0.15em] text-muted sm:grid">
              <span>Piece</span><span className="text-center">Quantity</span><span className="text-right">Total</span>
            </div>
            <div className="divide-y divide-ink/15">
              {items.map((item) => (
                <article key={`${item.id}-${item.size}`} className="grid grid-cols-[92px_1fr] gap-4 py-5 sm:grid-cols-[110px_1fr_130px_100px] sm:items-center sm:gap-6">
                  <Link to={`/products/${item.id}`} className="aspect-[4/5] overflow-hidden bg-cream">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </Link>
                  <div className="flex flex-col items-start">
                    <Link to={`/products/${item.id}`} className="text-sm hover:text-gold">{item.name}</Link>
                    <span className="mt-1 text-xs text-muted">{item.color}</span>
                    <span className="mt-1 text-xs text-muted">Size: {item.size}</span>
                    <span className="mt-2 text-xs sm:hidden">{formatPrice(item.price)}</span>
                    {item.stockQuantity !== null && (
                      <span className="mt-1 text-xs text-muted">
                        {item.stockQuantity > 0 ? `${item.stockQuantity} available` : 'Currently out of stock'}
                      </span>
                    )}
                    <button type="button" disabled={isMutating} onClick={() => removeFromCart(item.id, item.size)} className="mt-auto flex items-center gap-1 pt-3 text-[9px] uppercase tracking-[0.12em] text-muted hover:text-ink disabled:opacity-50 sm:mt-3 sm:pt-0"><Trash2 size={12} /> Remove</button>
                  </div>
                  <div className="col-start-2 flex items-center border border-ink/15 sm:col-start-auto sm:justify-self-center">
                    <button type="button" aria-label="Decrease quantity" disabled={isMutating} onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)} className="p-2.5 hover:text-gold disabled:opacity-50"><Minus size={13} /></button>
                    <span className="min-w-7 text-center text-xs">{item.quantity}</span>
                    <button type="button" aria-label="Increase quantity" disabled={isMutating || (item.stockQuantity !== null && item.quantity >= item.stockQuantity)} onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)} className="p-2.5 hover:text-gold disabled:cursor-not-allowed disabled:opacity-50"><Plus size={13} /></button>
                  </div>
                  <span className="hidden text-right text-sm sm:block">{formatPrice(item.price * item.quantity)}</span>
                </article>
              ))}
            </div>
          </div>
          <aside className="h-fit bg-white/70 p-6 sm:p-8">
            <h2 className="font-display text-2xl">Order summary</h2>
            <div className="mt-6 space-y-4 border-b border-ink/15 pb-5 text-sm">
              <div className="flex justify-between"><span className="text-muted">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Shipping</span><span>{shipping === 0 ? 'Complimentary' : formatPrice(shipping)}</span></div>
            </div>
            <div className="flex justify-between py-5 text-sm font-medium"><span>Estimated total</span><span>{formatPrice(subtotal + shipping)}</span></div>
            <p className="mb-5 text-xs leading-5 text-muted">Taxes calculated at checkout. Complimentary shipping on orders over $500.</p>
            <Link to="/checkout" className="flex w-full items-center justify-center gap-2 bg-ink px-5 py-4 text-[10px] uppercase tracking-[0.16em] text-ivory transition hover:bg-gold">Continue to checkout <ArrowRight size={14} /></Link>
          </aside>
        </div>
      )}
    </div>
  )
}
