import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="relative min-h-[560px] overflow-hidden bg-[#c4b8a8] sm:min-h-[640px] lg:min-h-[690px]">
      <img
        src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2200&q=90"
        alt="A quiet moment in the VESTORA autumn collection"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/15 to-transparent" />
      <div className="relative mx-auto flex min-h-[560px] max-w-[1440px] items-center px-6 sm:min-h-[640px] sm:px-10 lg:min-h-[690px] lg:px-16">
        <div className="max-w-[550px] pb-4 text-ivory">
          <p className="mb-5 text-[10px] uppercase tracking-[0.25em] sm:text-[11px]">The autumn / winter edit</p>
          <h1 className="font-display text-[48px] leading-[1.08] sm:text-[64px] lg:text-[76px]">The art of<br />having less.</h1>
          <p className="mt-6 max-w-sm text-sm leading-6 text-white/85 sm:text-[15px]">A considered wardrobe. Thoughtful materials. Pieces that feel like they have always been yours.</p>
          <Link to="/collections" className="mt-8 inline-flex items-center gap-3 border border-ivory px-5 py-3.5 text-[10px] uppercase tracking-[0.17em] transition hover:bg-ivory hover:text-ink">
            Discover the collection <ArrowRight size={15} />
          </Link>
        </div>
      </div>
      <div className="absolute bottom-6 right-7 hidden text-right text-[9px] uppercase leading-5 tracking-[0.2em] text-white/80 sm:block">
        Objects of intention<br />No. 04 — 2025
      </div>
    </section>
  )
}
