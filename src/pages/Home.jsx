import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import HeroSection from '../components/HeroSection.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import { fetchProducts } from '../services/catalog.js'

const categories = [
  {
    name: 'The wardrobe',
    detail: 'Pieces to live in',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=85',
    category: 'Ready-to-wear',
  },
  {
    name: 'Objects to keep',
    detail: 'Bags & accessories',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=85',
    category: 'Bags',
  },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [catalogState, setCatalogState] = useState('loading')
  const [catalogError, setCatalogError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setCatalogState('loading')
    setCatalogError('')

    fetchProducts({ signal: controller.signal })
      .then((catalog) => {
        setProducts(catalog.slice(0, 4))
        setCatalogState(catalog.length ? 'ready' : 'empty')
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        setCatalogError(error.message)
        setCatalogState('error')
      })

    return () => controller.abort()
  }, [reloadKey])

  return (
    <>
      <HeroSection />
      <section className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-20 lg:px-12 lg:py-24">
        <div className="mx-auto mb-10 max-w-xl text-center sm:mb-14">
          <p className="eyebrow">A quieter kind of luxury</p>
          <h2 className="section-title">Considered in every detail.</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted">We believe the best wardrobe is built slowly. A thoughtful edit of enduring forms, made to be part of your everyday.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
          {categories.map((category) => (
            <Link key={category.name} to={`/collections?category=${encodeURIComponent(category.category)}`} className="category-tile group">
              <img src={category.image} alt="" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 text-ivory sm:bottom-8 sm:left-8">
                <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-white/75">{category.detail}</p>
                <h3 className="font-display text-3xl">{category.name}</h3>
                <span className="mt-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em]">Explore <ArrowRight size={14} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="bg-white/50">
        <div className="mx-auto max-w-[1440px] px-5 py-16 sm:px-10 sm:py-20 lg:px-12">
          <div className="mb-8 flex items-end justify-between sm:mb-10">
            <div>
              <p className="eyebrow">Chosen with intention</p>
              <h2 className="section-title">The considered edit</h2>
            </div>
            <Link to="/collections" className="hidden items-center gap-2 pb-1 text-[10px] uppercase tracking-[0.15em] hover:text-gold sm:inline-flex">View all <ArrowRight size={14} /></Link>
          </div>
          {catalogState === 'loading' && <LoadingSpinner label="Curating the edit" />}
          {catalogState === 'error' && (
            <div className="py-16 text-center" role="alert">
              <p className="text-sm text-muted">{catalogError}</p>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-4 border-b border-ink pb-1 text-[10px] uppercase tracking-[0.15em] hover:text-gold">Try again</button>
            </div>
          )}
          {catalogState === 'empty' && (
            <div className="py-16 text-center text-sm text-muted" role="status">Our considered edit is being prepared. Please visit again soon.</div>
          )}
          {catalogState === 'ready' && <ProductGrid products={products} />}
          <Link to="/collections" className="mt-8 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] hover:text-gold sm:hidden">View all pieces <ArrowRight size={14} /></Link>
        </div>
      </section>
      <section className="mx-auto grid max-w-[1440px] items-center gap-8 px-5 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-24">
        <div className="order-2 lg:order-1">
          <p className="eyebrow">The VESTORA point of view</p>
          <h2 className="section-title max-w-lg">Buy less.<br />Choose beautifully.</h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-muted">Good design is never in a hurry. We work with trusted makers and natural materials to create pieces that soften, settle, and become more your own with time.</p>
          <Link to="/collections" className="mt-7 inline-flex items-center gap-3 border-b border-ink pb-2 text-[10px] uppercase tracking-[0.17em] transition hover:border-gold hover:text-gold">Discover our collection <ArrowRight size={14} /></Link>
        </div>
        <div className="order-1 aspect-[4/3] overflow-hidden bg-cream lg:order-2">
          <img src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1300&q=85" alt="Thoughtfully arranged timeless wardrobe pieces" className="h-full w-full object-cover" loading="lazy" />
        </div>
      </section>
    </>
  )
}
