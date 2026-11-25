import { useState } from 'react'
import { Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminDataState from '../../components/admin/AdminDataState.jsx'
import useAdminResource from '../../hooks/useAdminResource.js'
import api from '../../services/api.js'

export default function AdminReviews() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState('')
  const query = new URLSearchParams({ page: String(page), limit: '20' })
  if (search) query.set('search', search)
  const { data, loading, error, reload } = useAdminResource(`/admin/reviews?${query}`)
  const reviews = data?.reviews ?? []
  const pagination = data?.pagination

  function applySearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  async function removeReview(review) {
    if (!window.confirm(`Delete this review of “${review.productName}”? This cannot be undone.`)) return
    setActionError('')
    try {
      await api.delete(`/admin/reviews/${review.id}`)
      reload()
    } catch (requestError) {
      setActionError(requestError.message)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <p className="eyebrow">Customer perspectives</p>
        <h1 className="section-title text-4xl">Reviews.</h1>
        <p className="mt-3 text-sm text-muted">Review moderation is limited to authorized deletion; no rating or author details are altered.</p>
      </div>
      {actionError && <p className="mb-5 border border-red-800/20 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</p>}
      <form id="review-search-form" onSubmit={applySearch} className="mb-5 flex max-w-xl gap-3">
        <div className="flex-1">
          <label htmlFor="review-search" className="form-label">Search reviews</label>
          <input id="review-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="form-input" placeholder="Product, author, or review text" />
        </div>
        <button type="submit" className="mt-6 min-h-[46px] border border-ink/20 px-4 text-[9px] uppercase tracking-[0.13em] hover:border-gold hover:text-gold">Search</button>
      </form>

      <AdminDataState loading={loading} error={error} onRetry={reload}>
        <section className="border border-ink/10 bg-white/70">
          <div className="divide-y divide-ink/10">
            {reviews.length ? reviews.map((review) => (
              <article key={review.id} className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link to={`/products/${encodeURIComponent(review.productSlug)}`} className="text-sm hover:text-gold">{review.productName}</Link>
                    <span className="inline-flex items-center gap-1 text-[10px] text-gold"><Star size={12} fill="currentColor" /> {review.rating}/5</span>
                  </div>
                  {review.title && <h2 className="mt-3 font-display text-xl">{review.title}</h2>}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{review.body}</p>
                  <p className="mt-4 text-[9px] uppercase tracking-[0.12em] text-muted">By {review.author} · {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(review.createdAt))}</p>
                </div>
                <button type="button" onClick={() => removeReview(review)} className="w-fit border-b border-ink/25 pb-1 text-[9px] uppercase tracking-[0.13em] text-muted hover:border-red-700 hover:text-red-700">Delete review</button>
              </article>
            )) : <p className="px-6 py-16 text-center text-sm text-muted">No reviews match this search.</p>}
          </div>
          {pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-ink/10 px-4 py-4 sm:px-6">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="text-[9px] uppercase tracking-[0.13em] text-muted disabled:opacity-40">Previous</button>
              <span className="text-[10px] text-muted">Page {pagination.page} of {pagination.totalPages}</span>
              <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="text-[9px] uppercase tracking-[0.13em] text-muted disabled:opacity-40">Next</button>
            </div>
          )}
        </section>
      </AdminDataState>
    </div>
  )
}
