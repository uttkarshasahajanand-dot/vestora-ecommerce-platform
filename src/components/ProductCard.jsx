import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../data/products.js'

export default function ProductCard({ product }) {
  const { addToCart } = useCart()

  return (
    <article className="group">
      <div className="product-image-wrap">
        <Link to={`/products/${product.id}`} className="block h-full overflow-hidden">
          <img src={product.image} alt={product.name} className="product-image" loading="lazy" />
        </Link>
        {product.label && <span className="absolute left-3 top-3 bg-ivory px-2.5 py-1 text-[9px] tracking-[0.14em] text-ink">{product.label}</span>}
        <button
          type="button"
          onClick={() => addToCart(product, product.category === 'Accessories' || product.category === 'Bags' ? 'One size' : 'M')}
          className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center bg-ivory text-ink opacity-100 transition hover:bg-gold hover:text-white sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
          aria-label={`Add ${product.name} to bag`}
        >
          <Plus size={18} strokeWidth={1.5} />
        </button>
      </div>
      <div className="flex items-start justify-between gap-2 pt-3">
        <div>
          <Link to={`/products/${product.id}`} className="text-[13px] tracking-wide text-ink hover:text-gold">{product.name}</Link>
          <p className="mt-1 text-[11px] text-muted">{product.color}</p>
        </div>
        <span className="shrink-0 text-[12px] text-ink">{formatPrice(product.price)}</span>
      </div>
    </article>
  )
}
