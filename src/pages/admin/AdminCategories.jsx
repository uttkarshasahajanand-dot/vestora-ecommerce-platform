import { useState } from 'react'
import AdminDataState from '../../components/admin/AdminDataState.jsx'
import useAdminResource from '../../hooks/useAdminResource.js'
import api from '../../services/api.js'

const emptyForm = { name: '', slug: '', description: '' }

export default function AdminCategories() {
  const { data, loading, error, reload } = useAdminResource('/admin/categories')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState('')
  const [actionError, setActionError] = useState('')
  const [saving, setSaving] = useState(false)
  const categories = data?.categories ?? []

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function startEdit(category) {
    setEditingId(String(category.id))
    setForm({ name: category.name, slug: category.slug, description: category.description || '' })
    setActionError('')
  }

  function cancelEdit() {
    setEditingId('')
    setForm(emptyForm)
    setActionError('')
  }

  async function submit(event) {
    event.preventDefault()
    setSaving(true)
    setActionError('')
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim() || null,
    }
    try {
      if (editingId) await api.patch(`/admin/categories/${editingId}`, payload)
      else await api.post('/admin/categories', payload)
      cancelEdit()
      reload()
    } catch (requestError) {
      setActionError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  async function deactivate(category) {
    if (!window.confirm(`Deactivate “${category.name}”? Existing product and order history will be preserved.`)) return
    setActionError('')
    try {
      await api.delete(`/admin/categories/${category.id}`)
      reload()
    } catch (requestError) {
      setActionError(requestError.message)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <p className="eyebrow">The store structure</p>
        <h1 className="section-title text-4xl">Categories.</h1>
        <p className="mt-3 text-sm text-muted">Category removal deactivates it; records remain attached to existing products.</p>
      </div>
      {actionError && <p className="mb-5 border border-red-800/20 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{actionError}</p>}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <AdminDataState loading={loading} error={error} onRetry={reload}>
          <section className="border border-ink/10 bg-white/70">
            <div className="divide-y divide-ink/10">
              {categories.length ? categories.map((category) => (
                <article key={category.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
                  <div>
                    <h2 className="text-sm">{category.name}</h2>
                    <p className="mt-1 text-[10px] text-muted">{category.slug}{category.description ? ` · ${category.description}` : ''}</p>
                    <span className={`mt-2 inline-block text-[9px] uppercase tracking-[0.12em] ${Number(category.isActive) === 1 ? 'text-emerald-800' : 'text-muted'}`}>{Number(category.isActive) === 1 ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div className="flex gap-4 text-[9px] uppercase tracking-[0.13em]">
                    <button type="button" onClick={() => startEdit(category)} className="border-b border-ink/30 pb-1 hover:border-gold hover:text-gold">Edit</button>
                    {Number(category.isActive) === 1 && <button type="button" onClick={() => deactivate(category)} className="border-b border-ink/30 pb-1 text-muted hover:border-red-700 hover:text-red-700">Deactivate</button>}
                  </div>
                </article>
              )) : <p className="px-6 py-14 text-center text-sm text-muted">No categories have been created.</p>}
            </div>
          </section>
        </AdminDataState>

        <form onSubmit={submit} className="h-fit border border-ink/10 bg-white/70 p-5 sm:p-6">
          <p className="eyebrow">{editingId ? 'Refine a category' : 'Organize the collection'}</p>
          <h2 className="mb-5 font-display text-2xl">{editingId ? 'Edit category' : 'Add category'}</h2>
          <label htmlFor="category-name" className="form-label">Name</label>
          <input id="category-name" name="name" value={form.name} onChange={updateForm} required minLength={2} maxLength={100} className="form-input mb-4" />
          <label htmlFor="category-slug" className="form-label">URL slug</label>
          <input id="category-slug" name="slug" value={form.slug} onChange={updateForm} maxLength={120} className="form-input mb-4" placeholder="Generated from the name if blank" />
          <label htmlFor="category-description" className="form-label">Description</label>
          <textarea id="category-description" name="description" value={form.description} onChange={updateForm} maxLength={500} rows={4} className="form-input resize-y" />
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={saving} className="bg-ink px-5 py-3 text-[9px] uppercase tracking-[0.14em] text-ivory hover:bg-gold disabled:opacity-50">{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create category'}</button>
            {editingId && <button type="button" onClick={cancelEdit} className="border border-ink/20 px-5 py-3 text-[9px] uppercase tracking-[0.14em] text-muted hover:text-ink">Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  )
}
