import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, ShoppingBag, X } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { label: 'New arrivals', to: '/collections?edit=new' },
  { label: 'Ready-to-wear', to: '/collections?category=Ready-to-wear' },
  { label: 'Bags & accessories', to: '/collections?category=Bags' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { itemCount, error: cartError, canRetry, isMutating, retry, clearError } = useCart()
  const { user, logout, authError, clearAuthError } = useAuth()
  const { pathname } = useLocation()

  function handleLogout() {
    logout()
    setMenuOpen(false)
  }

  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-[10px] uppercase tracking-[0.18em] text-ivory sm:text-[11px]">
        Complimentary shipping on orders over $500
      </div>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-ivory/95 backdrop-blur-md">
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <button
            type="button"
            className="p-2 text-ink lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <Link to="/" className="absolute left-1/2 -translate-x-1/2 font-display text-[27px] font-medium tracking-[0.21em] text-ink sm:text-[30px] lg:static lg:translate-x-0">
            VESTORA
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.label} to={item.to} className="nav-link">
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden items-center gap-4 sm:flex">
                {user.role === 'admin' && <Link to="/admin" className="text-[10px] uppercase tracking-[0.13em] text-gold transition hover:text-ink">Atelier</Link>}
                {user.role === 'customer' && <Link to="/orders" className="text-[10px] uppercase tracking-[0.13em] text-ink transition hover:text-gold">My orders</Link>}
                <span className="max-w-32 truncate text-[11px] text-muted">Hello, {user.name.split(' ')[0]}</span>
                <button type="button" onClick={handleLogout} className="text-[11px] uppercase tracking-[0.13em] text-ink transition hover:text-gold">Sign out</button>
              </div>
            ) : (
              <Link to="/login" className="hidden text-[11px] uppercase tracking-[0.13em] text-ink transition hover:text-gold sm:block">
                Sign in
              </Link>
            )}
            <Link to="/cart" className="relative flex items-center gap-2 p-2 text-ink" aria-label={`Shopping bag, ${itemCount} items`}>
              <ShoppingBag size={19} strokeWidth={1.5} />
              <span className="hidden text-[11px] uppercase tracking-[0.13em] sm:block">Bag</span>
              <span className="absolute -right-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-gold px-1 text-[9px] text-white">
                {itemCount}
              </span>
            </Link>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-ink/10 bg-ivory px-6 py-5 lg:hidden">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-5">
              {navItems.map((item) => (
                <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="text-[11px] uppercase tracking-[0.15em]">
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  <span className="text-[11px] text-muted">Signed in as {user.name}</span>
                  {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="w-fit text-[11px] uppercase tracking-[0.15em] text-gold">Open atelier</Link>}
                  {user.role === 'customer' && <Link to="/orders" onClick={() => setMenuOpen(false)} className="w-fit text-[11px] uppercase tracking-[0.15em]">My orders</Link>}
                  <button type="button" onClick={handleLogout} className="w-fit text-[11px] uppercase tracking-[0.15em]">Sign out</button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-[11px] uppercase tracking-[0.15em]">
                  Sign in / Register
                </Link>
              )}
            </div>
          </nav>
        )}
      </header>
      {authError && (
        <div className="flex items-center justify-between gap-4 border-b border-ink/10 bg-white/70 px-5 py-2 text-xs text-muted sm:px-8 lg:px-12" role="alert">
          <span>{authError}</span>
          <button type="button" onClick={clearAuthError} className="shrink-0 text-[10px] uppercase tracking-[0.12em] text-ink">Dismiss</button>
        </div>
      )}
      {cartError && pathname !== '/cart' && (
        <div className="flex items-center justify-between gap-4 border-b border-gold/30 bg-white/70 px-5 py-3 text-xs text-muted sm:px-8 lg:px-12" role="alert">
          <span>{cartError}</span>
          <div className="flex shrink-0 items-center gap-4">
            {canRetry && <button type="button" disabled={isMutating} onClick={retry} className="text-[9px] uppercase tracking-[0.12em] text-ink disabled:opacity-50">Retry</button>}
            <button type="button" onClick={clearError} className="text-[9px] uppercase tracking-[0.12em] text-ink">Dismiss</button>
          </div>
        </div>
      )}
    </>
  )
}
