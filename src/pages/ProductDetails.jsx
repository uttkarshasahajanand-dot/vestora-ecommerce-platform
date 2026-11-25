import { useEffect, useState } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../data/products.js'
import { fetchProduct, fetchProducts } from '../services/catalog.js'

const sizes = ['XS', 'S', 'M', 'L', 'XL']

export default function ProductDetails() {
  const { productId } = useParams()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [recommended, setRecommended] = useState([])
  const [recommendationsLoading, setRecommendationsLoading] = useState(true)
  const [recommendationsError, setRecommendationsError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [size, setSize] = useState('')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setProduct(null)
    setLoading(true)
    setError(null)
    setRecommended([])
    setRecommendationsLoading(true)
    setRecommendationsError('')

    fetchProduct(productId, { signal: controller.signal })
      .then(setProduct)
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    fetchProducts({ signal: controller.signal })
      .then((catalog) => setRecommended(catalog.filter((item) => item.id !== productId).slice(0, 4)))
      .catch((requestError) => {
        if (!controller.signal.aborted) setRecommendationsError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setRecommendationsLoading(false)
      })

    return () => controller.abort()
  }, [productId, reloadKey])

  if (loading) return <LoadingSpinner label="Loading this piece" />

  if (error?.status === 404 || (!error && !product)) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="eyebrow">A little off the rack</p>
        <h1 className="section-title">We couldn’t find that piece.</h1>
        <Link to="/collections" className="mt-6 inline-flex border-b border-ink pb-2 text-[10px] uppercase tracking-[0.15em]">Explore the collection</Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center" role="alert">
        <p className="eyebrow">A moment, please</p>
        <h1 className="section-title">We couldn’t load that piece.</h1>
        <p className="mt-4 text-sm leading-6 text-muted">{error.message}</p>
        <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-6 border-b border-ink pb-2 text-[10px] uppercase tracking-[0.15em] hover:text-gold">Try again</button>
        <Link to="/collections" className="mt-6 ml-5 inline-flex border-b border-ink pb-2 text-[10px] uppercase tracking-[0.15em]">Explore the collection</Link>
      </div>
    )
  }

  const oneSize = product.category === 'Bags' || product.category === 'Accessories'

  async function handleAdd() {
    if (!oneSize && !size) return
    const addedToCart = await addToCart(product, oneSize ? 'One size' : size)
    if (!addedToCart) return
    setAdded(true)
    window.setTimeout(() => setAdded(false), 2000)
  }

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-5 pt-6 sm:px-10 lg:px-12">
        <Link to="/collections" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-muted hover:text-ink"><ArrowLeft size={14} /> Back to collection</Link>
      </div>
      <section className="mx-auto grid max-w-[1440px] gap-8 px-5 py-7 sm:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-12 lg:py-10">
        <div className="aspect-[4/5] overflow-hidden bg-cream">
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col justify-center py-4 lg:py-12">
          <p className="eyebrow">{product.category}</p>
          <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">{product.name}</h1>
          <p className="mt-4 text-sm text-muted">{product.color}</p>
          <p className="mt-6 text-lg">{formatPrice(product.price)}</p>
          <p className="mt-2 text-xs text-muted" aria-live="polite">
            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Currently out of stock'}
          </p>
          <div className="my-7 h-px bg-ink/15" />
          <p className="max-w-lg text-sm leading-7 text-muted">{product.description}</p>
          {!oneSize && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.15em]">Select size</span>
                <button type="button" className="text-[10px] text-muted underline underline-offset-4">Size guide</button>
              </div>
              <div className="flex gap-2">
                {sizes.map((option) => (
                  <button type="button" key={option} onClick={() => setSize(option)} className={`h-11 w-12 border text-[11px] transition ${size === option ? 'border-ink bg-ink text-ivory' : 'border-ink/20 hover:border-ink'}`}>{option}</button>
                ))}
              </div>
            </div>
          )}
          {oneSize && <p className="mt-8 text-[10px] uppercase tracking-[0.15em] text-muted">One size</p>}
          <button type="button" onClick={handleAdd} className="mt-7 flex w-full items-center justify-center gap-2 bg-ink px-6 py-4 text-[10px] uppercase tracking-[0.17em] text-ivory transition hover:bg-gold">
            {added ? <><Check size={15} /> Added to bag</> : 'Add to bag'}
          </button>
          {!oneSize && !size && <p className="mt-2 text-xs text-muted">Please select a size to continue.</p>}
          <div className="mt-7 space-y-3 border-t border-ink/15 pt-5 text-xs text-muted">
            <p>Complimentary shipping on orders over $500.</p>
            <p>Thoughtful packaging. Easy returns within 14 days.</p>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-5 py-14 sm:px-10 lg:px-12">
        <div className="mb-8">
          <p className="eyebrow">Complete the considered wardrobe</p>
          <h2 className="section-title text-3xl">You may also like</h2>
        </div>
        {recommendationsLoading && <LoadingSpinner label="Finding complementary pieces" />}
        {recommendationsError && <p className="py-10 text-sm text-muted" role="alert">{recommendationsError}</p>}
        {!recommendationsLoading && !recommendationsError && recommended.length > 0 && <ProductGrid products={recommended} />}
        {!recommendationsLoading && !recommendationsError && recommended.length === 0 && (
          <p className="py-10 text-sm text-muted" role="status">More pieces to discover soon.</p>
        )}
      </section>
    </>
  )
}
