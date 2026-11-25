import { useState } from 'react'
import { BarChart3, Boxes, ChevronDown, ClipboardList, Layers3, Menu, MessageSquareText, Store, Users, X } from 'lucide-react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const navigation = [
  { label: 'Overview', to: '/admin', icon: BarChart3, end: true },
  { label: 'Products', to: '/admin/products', icon: Boxes },
  { label: 'Orders', to: '/admin/orders', icon: ClipboardList },
  { label: 'Customers', to: '/admin/users', icon: Users },
  { label: 'Categories', to: '/admin/categories', icon: Layers3 },
  { label: 'Reviews', to: '/admin/reviews', icon: MessageSquareText },
]

function Navigation({ onNavigate }) {
  return navigation.map(({ label, to, icon: Icon, end }) => (
    <NavLink
      key={to}
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => `admin-navigation-link${isActive ? ' is-active' : ''}`}
    >
      <Icon size={16} strokeWidth={1.5} />
      {label}
    </NavLink>
  ))
}

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="admin-shell min-h-screen lg:flex">
      <aside className="admin-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 lg:flex lg:flex-col">
        <Link to="/admin" className="admin-brand flex h-20 items-center gap-3 px-7">
          <span className="font-display text-xl tracking-[0.18em]">VESTORA</span>
          <span className="admin-brand-label pl-3 text-[9px] uppercase tracking-[0.15em]">Atelier</span>
        </Link>
        <nav className="admin-navigation flex-1 space-y-1 px-3 py-6" aria-label="Administration">
          <Navigation />
        </nav>
        <Link to="/" className="admin-storefront-link m-4 flex items-center gap-3 px-3 pt-5 text-[10px] uppercase tracking-[0.14em]">
          <Store size={16} strokeWidth={1.5} /> View storefront
        </Link>
      </aside>

      <div className="admin-main-area min-w-0 flex-1 lg:pl-64">
        <header className="admin-topbar sticky top-0 z-20 flex h-16 items-center justify-between px-4 backdrop-blur-md sm:px-7 lg:h-20 lg:px-10">
          <div className="flex items-center gap-3">
            <button type="button" aria-label={menuOpen ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)} className="admin-menu-toggle p-2 lg:hidden">
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="lg:hidden">
              <span className="font-display text-lg tracking-[0.15em]">VESTORA</span>
              <span className="admin-brand-label ml-2 text-[9px] uppercase tracking-[0.14em]">Atelier</span>
            </div>
            <p className="hidden text-[10px] uppercase tracking-[0.18em] text-muted lg:block">Administration</p>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden text-right sm:block">
              <p className="text-xs">{user?.name}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.13em] text-muted">{user?.email}</p>
            </div>
            <button type="button" onClick={logout} className="admin-signout flex items-center gap-2 pl-3 text-[9px] uppercase tracking-[0.13em] sm:pl-5">
              <span className="admin-avatar flex h-8 w-8 items-center justify-center rounded-full text-xs">{user?.name?.slice(0, 1).toUpperCase() || 'A'}</span>
              <span className="hidden sm:inline">Sign out</span>
              <ChevronDown size={13} className="hidden sm:block" />
            </button>
          </div>
        </header>

        {menuOpen && (
          <nav className="admin-mobile-navigation fixed inset-x-0 top-16 z-20 px-3 py-4 lg:hidden" aria-label="Mobile administration">
            <Navigation onNavigate={() => setMenuOpen(false)} />
            <Link to="/" onClick={() => setMenuOpen(false)} className="admin-storefront-link mt-2 flex items-center gap-3 px-4 py-3 text-[10px] uppercase tracking-[0.14em]">
              <Store size={16} strokeWidth={1.5} /> View storefront
            </Link>
          </nav>
        )}

        <div className="admin-content mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-11">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
