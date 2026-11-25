import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-ivory">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 py-16 sm:px-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-12 lg:py-20">
        <div>
          <Link to="/" className="font-display text-[26px] tracking-[0.2em]">VESTORA</Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-ivory/60">Considered pieces for a life well dressed. Made with intention, chosen to last.</p>
        </div>
        <div>
          <p className="footer-heading">Explore</p>
          <Link className="footer-link" to="/collections">All collections</Link>
          <Link className="footer-link" to="/collections?category=Ready-to-wear">Ready-to-wear</Link>
          <Link className="footer-link" to="/collections?category=Bags">Bags & accessories</Link>
        </div>
        <div>
          <p className="footer-heading">Client care</p>
          <Link className="footer-link" to="/cart">Shipping & returns</Link>
          <Link className="footer-link" to="/login">My account</Link>
          <a className="footer-link" href="mailto:care@vestora.example">Contact us <ArrowUpRight size={13} className="inline" /></a>
        </div>
        <div>
          <p className="footer-heading">A note from us</p>
          <p className="text-sm leading-6 text-ivory/60">A thoughtful edit, delivered occasionally. Join our list for first looks and considered notes.</p>
          <form className="mt-4 flex border-b border-ivory/35 pb-2" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="newsletter-email" className="sr-only">Email address</label>
            <input id="newsletter-email" type="email" placeholder="Your email address" className="w-full bg-transparent text-sm outline-none placeholder:text-ivory/40" />
            <button type="submit" className="text-[10px] uppercase tracking-[0.15em] text-gold">Join</button>
          </form>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 border-t border-ivory/15 px-6 py-5 text-[10px] tracking-wide text-ivory/45 sm:flex-row sm:justify-between sm:px-10 lg:px-12">
        <span>© {new Date().getFullYear()} VESTORA. All rights reserved.</span>
        <span>Designed to be worn, and worn again.</span>
      </div>
    </footer>
  )
}
