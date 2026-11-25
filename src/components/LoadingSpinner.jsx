export default function LoadingSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4" role="status" aria-label={label}>
      <span className="h-8 w-8 animate-spin rounded-full border border-cream border-t-gold" />
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted">{label}</span>
    </div>
  )
}
