import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
import AdminDataState from '../../components/admin/AdminDataState.jsx'
import useAdminResource from '../../hooks/useAdminResource.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { formatPrice } from '../../data/products.js'
import api from '../../services/api.js'

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value))
}

export default function AdminUsers() {
  const { user: adminUser } = useAuth()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState('')
  const [userOrdersPage, setUserOrdersPage] = useState(1)
  const [actionError, setActionError] = useState('')
  const query = new URLSearchParams({ page: String(page), limit: '20' })
  if (search) query.set('search', search)
  if (role) query.set('role', role)
  const usersResource = useAdminResource(`/admin/users?${query}`)
  const userResource = useAdminResource(`/admin/users/${selectedId}`, { enabled: Boolean(selectedId) })
  const ordersResource = useAdminResource(`/admin/users/${selectedId}/orders?page=${userOrdersPage}&limit=10`, { enabled: Boolean(selectedId) })
  const users = usersResource.data?.users ?? []
  const pagination = usersResource.data?.pagination
  const selectedUser = userResource.data?.user

  function applySearch(event) {
    event.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  async function changeRole(target, nextRole) {
    if (String(target.id) === String(adminUser?.id) && nextRole !== 'admin') {
      setActionError('You cannot remove your own admin access.')
      return
    }
    if (!window.confirm(`Change ${target.name} from ${target.role} to ${nextRole}?`)) return
    setActionError('')
    try {
      await api.patch(`/admin/users/${target.id}/role`, { role: nextRole })
      usersResource.reload()
      if (String(selectedId) === String(target.id)) userResource.reload()
    } catch (requestError) {
      setActionError(requestError.message)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <p className="eyebrow">The people behind each order</p>
        <h1 className="section-title text-4xl">Customers & users.</h1>
        <p className="mt-3 text-sm text-muted">Profiles contain public account fields only. Passwords and authentication data are never returned.</p>
      </div>

      <section className="mb-5 grid gap-3 border border-ink/10 bg-white/70 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
        <form id="user-search-form" onSubmit={applySearch}>
          <label htmlFor="user-search" className="form-label">Find a user</label>
          <input id="user-search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="form-input" placeholder="Name or email" />
        </form>
        <div>
          <label htmlFor="user-role-filter" className="form-label">Role</label>
          <select id="user-role-filter" value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }} className="form-input">
            <option value="">All roles</option>
            <option value="customer">Customer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" form="user-search-form" className="min-h-[46px] border border-ink/20 px-4 text-[9px] uppercase tracking-[0.13em] hover:border-gold hover:text-gold"><Search size={14} className="mr-2 inline" />Search</button>
      </section>

      {actionError && <p className="mb-5 border border-red-800/20 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</p>}
      <AdminDataState loading={usersResource.loading} error={usersResource.error} onRetry={usersResource.reload}>
        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <section className="border border-ink/10 bg-white/70">
            <div className="divide-y divide-ink/10">
              {users.length ? users.map((entry) => (
                <article key={entry.id} className={`grid gap-3 px-4 py-4 sm:grid-cols-[1fr_150px_150px] sm:items-center sm:px-5 ${String(selectedId) === String(entry.id) ? 'bg-cream/70' : ''}`}>
                  <button type="button" onClick={() => { setSelectedId(String(entry.id)); setUserOrdersPage(1) }} className="min-w-0 text-left">
                    <span className="block truncate text-sm">{entry.name}</span>
                    <span className="mt-1 block truncate text-xs text-muted">{entry.email}</span>
                    <span className="mt-1 block text-[9px] uppercase tracking-[0.12em] text-muted">Joined {formatDate(entry.createdAt)}</span>
                  </button>
                  <label className="text-[9px] uppercase tracking-[0.12em] text-muted">
                    Role
                    <select
                      aria-label={`Role for ${entry.name}`}
                      value={entry.role}
                      disabled={String(entry.id) === String(adminUser?.id)}
                      onChange={(event) => changeRole(entry, event.target.value)}
                      className="form-input mt-2 min-h-10 text-xs normal-case tracking-normal disabled:opacity-50"
                    >
                      <option value="customer">Customer</option>
                      <option value="admin">Admin</option>
                    </select>
                  </label>
                  <button type="button" onClick={() => { setSelectedId(String(entry.id)); setUserOrdersPage(1) }} className="flex items-center justify-between text-[9px] uppercase tracking-[0.13em] text-gold sm:justify-end">
                    View details <ChevronRight size={14} />
                  </button>
                </article>
              )) : <p className="px-6 py-16 text-center text-sm text-muted">No users match these filters.</p>}
            </div>
            {pagination?.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-ink/10 px-4 py-4 sm:px-5">
                <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="text-[9px] uppercase tracking-[0.13em] text-muted disabled:opacity-40">Previous</button>
                <span className="text-[10px] text-muted">Page {pagination.page} of {pagination.totalPages}</span>
                <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} className="text-[9px] uppercase tracking-[0.13em] text-muted disabled:opacity-40">Next</button>
              </div>
            )}
          </section>

          <aside className="h-fit border border-ink/10 bg-white/70">
            <div className="border-b border-ink/10 px-5 py-4">
              <p className="eyebrow">Account profile</p>
              <h2 className="font-display text-2xl">User details</h2>
            </div>
            {!selectedId ? (
              <p className="px-5 py-10 text-sm text-muted">Choose a user to view their profile and order history.</p>
            ) : userResource.loading ? (
              <p className="px-5 py-8 text-sm text-muted" role="status">Loading profile…</p>
            ) : userResource.error ? (
              <div className="px-5 py-8 text-sm text-muted" role="alert">{userResource.error}<button type="button" onClick={() => { userResource.reload(); ordersResource.reload() }} className="mt-3 block border-b border-ink pb-1 text-[9px] uppercase tracking-[0.13em]">Try again</button></div>
            ) : selectedUser && (
              <div className="p-5">
                <p className="text-sm">{selectedUser.name}</p>
                <p className="mt-1 break-all text-xs text-muted">{selectedUser.email}</p>
                <p className="mt-2 text-[9px] uppercase tracking-[0.12em] text-gold">{selectedUser.role}</p>
                <p className="mt-4 text-xs text-muted">Registered {formatDate(selectedUser.createdAt)}</p>
                <div className="mt-6 border-t border-ink/10 pt-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl">Order history</h3>
                    {ordersResource.data?.pagination && <span className="text-[9px] text-muted">{ordersResource.data.pagination.total} orders</span>}
                  </div>
                  {ordersResource.loading ? <p className="mt-4 text-xs text-muted" role="status">Loading orders…</p>
                    : ordersResource.error ? <p className="mt-4 text-xs text-red-800" role="alert">{ordersResource.error}</p>
                      : ordersResource.data?.orders?.length ? (
                        <>
                          <div className="mt-3 divide-y divide-ink/10">
                            {ordersResource.data.orders.map((order) => (
                              <Link key={order.id} to={`/admin/orders/${order.id}`} className="flex items-center justify-between gap-3 py-3 text-xs hover:text-gold">
                                <span><span className="block">{order.orderNumber}</span><span className="mt-1 block text-[10px] text-muted">{order.status}</span></span>
                                <span>{formatPrice(order.total)}</span>
                              </Link>
                            ))}
                          </div>
                          {ordersResource.data.pagination.totalPages > 1 && (
                            <div className="mt-3 flex items-center justify-between text-[9px] uppercase tracking-[0.12em]">
                              <button type="button" disabled={userOrdersPage <= 1} onClick={() => setUserOrdersPage((current) => current - 1)} className="text-muted disabled:opacity-40">Previous</button>
                              <span className="text-muted">{userOrdersPage} / {ordersResource.data.pagination.totalPages}</span>
                              <button type="button" disabled={userOrdersPage >= ordersResource.data.pagination.totalPages} onClick={() => setUserOrdersPage((current) => current + 1)} className="text-muted disabled:opacity-40">Next</button>
                            </div>
                          )}
                        </>
                      ) : <p className="mt-4 text-xs text-muted">No orders on record.</p>}
                </div>
              </div>
            )}
          </aside>
        </div>
      </AdminDataState>
    </div>
  )
}
