import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import ProductGrid from '../components/ProductGrid.jsx'
import { fetchCategories, fetchProducts } from '../services/catalog.js'

function isBagsOrAccessories(category) {
  const value = String(category || '').trim().toLowerCase()
  return ['bags', 'accessories', 'bags & accessories', 'bags-accessories'].includes(value)
}

export default function Collections() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const activeCategory = searchParams.get('category') || 'All pieces'
  const showingNewArrivals = searchParams.get('edit') === 'new'
  const filters = useMemo(() => {
    const readyToWear = categories.find((category) => category.slug === 'ready-to-wear')
    const hasBagsOrAccessories = categories.some((category) => isBagsOrAccessories(category.slug))
    const otherCategories = categories.filter((category) => (
      category !== readyToWear && !isBagsOrAccessories(category.slug)
    ))

    return [
      { label: 'All pieces', value: 'All pieces' },
      ...(readyToWear ? [{ label: readyToWear.name, value: readyToWear.name }] : []),
      ...(hasBagsOrAccessories ? [{ label: 'Bags & accessories', value: 'Bags' }] : []),
      ...otherCategories.map((category) => ({ label: category.name, value: category.name })),
    ]
  }, [categories])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')

    Promise.all([
      fetchProducts({ signal: controller.signal }),
      fetchCategories({ signal: controller.signal }),
    ])
      .then(([catalog, categoryList]) => {
        setProducts(catalog)
        setCategories(categoryList)
        setLoading(false)
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return
        setError(requestError.message)
        setLoading(false)
      })

    return () => controller.abort()
  }, [reloadKey])

  const visibleProducts = useMemo(
    () => products.filter((product) => {
      const selectedCategory = categories.find((category) => (
        category.name.toLowerCase() === activeCategory.toLowerCase()
        || category.slug.toLowerCase() === activeCategory.toLowerCase()
      ))
      const matchesCategory = activeCategory === 'All pieces'
        || (isBagsOrAccessories(activeCategory)
          ? isBagsOrAccessories(product.category)
          : product.category === selectedCategory?.name)
      return matchesCategory && (!showingNewArrivals || product.label === 'NEW ARRIVAL')
    }),
    [activeCategory, categories, products, showingNewArrivals],
  )

  function chooseCategory(category) {
    if (category === 'All pieces') setSearchParams({})
    else setSearchParams({ category })
  }

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-10 sm:py-16 lg:px-12 lg:py-20">
      <div className="border-b border-ink/15 pb-8 text-center sm:pb-10">
        <p className="eyebrow">The VESTORA collection</p>
        <h1 className="section-title text-4xl sm:text-5xl">{showingNewArrivals ? 'New arrivals.' : 'Pieces to keep.'}</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted">{showingNewArrivals ? 'The latest thoughtful additions to the VESTORA wardrobe.' : 'A considered collection of enduring silhouettes, quiet details, and beautiful materials.'}</p>
      </div>
      <div className="flex flex-col justify-between gap-5 py-6 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {filters.map((category) => (
            <button
              type="button"
              key={category.value}
              onClick={() => chooseCategory(category.value)}
              className={`text-[10px] uppercase tracking-[0.14em] transition ${(isBagsOrAccessories(category.value) ? isBagsOrAccessories(activeCategory) : activeCategory === category.value) ? 'border-b border-gold pb-1 text-ink' : 'text-muted hover:text-ink'}`}
            >
              {category.label}
            </button>
          ))}
        </div>
        {!loading && !error && <span className="text-[11px] text-muted">{visibleProducts.length} considered pieces</span>}
      </div>
      {loading && <LoadingSpinner label="Loading the collection" />}
      {error && (
        <div className="py-16 text-center" role="alert">
          <p className="text-sm text-muted">{error}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-4 border-b border-ink pb-1 text-[10px] uppercase tracking-[0.15em] hover:text-gold">Try again</button>
        </div>
      )}
      {!loading && !error && visibleProducts.length > 0 && <ProductGrid products={visibleProducts} />}
      {!loading && !error && visibleProducts.length === 0 && (
        <div className="py-24 text-center text-sm text-muted" role="status">
          {products.length === 0 ? 'Our collection is being prepared. Please visit again soon.' : 'More pieces in this collection are coming soon.'}
        </div>
      )}
    </div>
  )
}
