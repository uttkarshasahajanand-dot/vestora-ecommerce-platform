import LoadingSpinner from '../LoadingSpinner.jsx'

export default function AdminDataState({ loading, error, onRetry, children }) {
  if (loading) return <LoadingSpinner label="Loading administration data" />
  if (error) {
    return (
      <div className="admin-data-error border border-ink/15 bg-white/70 px-6 py-10 text-center" role="alert">
        <p className="text-sm text-muted">{error}</p>
        {onRetry && <button type="button" onClick={onRetry} className="mt-4 border-b border-ink pb-1 text-[10px] uppercase tracking-[0.15em] hover:text-gold">Try again</button>}
      </div>
    )
  }
  return children
}
