import { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminDataState from '../../components/admin/AdminDataState.jsx'
import useAdminResource from '../../hooks/useAdminResource.js'
import api from '../../services/api.js'
import { formatPrice } from '../../data/products.js'

export default function AdminProducts() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [active, setActive] = useState('')
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState('')
  const query = new URLSearchParams({ page: String(page), limit: '20' })
  if (search) query.set('search', search)
  if (category) query.set('category', category)
  if (active) query.set('active', active)
  const { data, loading, error, reload } = useAdminResource(`/admin/products?${query}`)
  const categories = useAdminResource('/admin/categories')
  const products = data?.products ?? []
  const pagination = data?.pagination

  async function deactivateProduct(product) {
    if (!window.confirm(`Deactivate “${product.name}”? It will no longer appear in the storefront.`)) return
    setActionError('')
    try {
      await api.delete(`/admin/products/${encodeURIComponent(product.id)}`)
      reload()
    } catch (requestError) {
      setActionError(requestError.message)
    }
  }

  function applySearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The collection</p>
          <h1 className="section-title text-4xl">Products.</h1>
          <p className="mt-3 text-sm text-muted">Manage details, pricing, and available inventory.</p>
        </div>
        <Link to="/admin/products/new" className="bg-ink px-5 py-3 text-[9px] uppercase tracking-[0.15em] text-ivory transition hover:bg-gold">Add a piece</Link>
      </div>

      <section className="mb-5 grid gap-3 border border-ink/10 bg-white/70 p-4 sm:grid-cols-[1fr_180px_150px_auto] sm:items-end">
        <form id="product-search-form" onSubmit={applySearch}>
          <label htmlFor="product-search" className="form-label">Search collection</label>
          <input id="product-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="form-input" placeholder="Name, slug, or SKU" />
        </form>
        <div>
          <label htmlFor="product-category" className="form-label">Category</label>
          <select id="product-category" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }} className="form-input">
            <option value="">All categories</option>
            {(categories.data?.categories ?? []).map((item) => <option key={item.id} value={item.name}>{item.name}{!item.isActive ? ' · inactive' : ''}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="product-active" className="form-label">Visibility</label>
          <select id="product-active" value={active} onChange={(event) => { setActive(event.target.value); setPage(1) }} className="form-input">
            <option value="">All pieces</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
        <button type="submit" form="product-search-form" className="min-h-[46px] border border-ink/20 px-4 text-[9px] uppercase tracking-[0.13em] hover:border-gold hover:text-gold">Search</button>
      </section>

      {actionError && <p className="mb-5 border border-red-800/20 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</p>}
      <AdminDataState loading={loading || categories.loading} error={error || categories.error} onRetry={() => { reload(); categories.reload() }}>
        <div className="border border-ink/10 bg-white/70">
          <div className="flex items-center justify-between border-b border-ink/10 px-4 py-4 sm:px-6">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{pagination?.total ?? products.length} catalog records</p>
            <p className="text-[10px] text-muted">Out-of-stock pieces are marked clearly.</p>
          </div>
          {products.length ? (
            <div className="divide-y divide-ink/10">
              {products.map((product) => (
                <article key={product.id} className="grid gap-3 px-4 py-4 sm:grid-cols-[68px_1fr_auto] sm:items-center sm:px-6">
                  <img src={product.image} alt="" className="h-20 w-16 bg-cream object-cover" />
                  <div className="min-w-0">
                    <p className="text-sm">{product.name}</p>
                    <p className="mt-1 text-[10px] text-muted">{product.category} · {product.color || 'Color not specified'} · {product.id}</p>
                    <p className="mt-2 text-xs">
                      {formatPrice(product.price)} <span className="px-1 text-ink/25">/</span>
                      <span className={Number(product.stockQuantity) === 0 ? 'text-red-700' : 'text-muted'}>
                        {Number(product.stockQuantity) === 0 ? 'Out of stock' : `${product.stockQuantity} in stock`}
                      </span>
                      {!product.isActive && <span className="ml-2 uppercase tracking-[0.1em] text-muted">Inactive</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[9px] uppercase tracking-[0.12em]">
                    <Link to={`/admin/products/${encodeURIComponent(product.id)}/edit`} className="border-b border-ink/30 pb-1 hover:border-gold hover:text-gold">Edit</Link>
                    {product.isActive && <button type="button" onClick={() => deactivateProduct(product)} className="border-b border-ink/30 pb-1 text-muted hover:border-red-700 hover:text-red-700">Deactivate</button>}
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="px-6 py-16 text-center text-sm text-muted">No products match these filters.</p>}
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
