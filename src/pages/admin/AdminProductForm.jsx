import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminDataState from '../../components/admin/AdminDataState.jsx'
import useAdminResource from '../../hooks/useAdminResource.js'
import api from '../../services/api.js'

const blankProduct = {
  name: '',
  slug: '',
  sku: '',
  category: '',
  description: '',
  color: '',
  image: '',
  label: '',
  price: '',
  stockQuantity: '',
  isActive: true,
}

function isActiveCategory(category) {
  return category.isActive === true || Number(category.isActive) === 1
}

export default function AdminProductForm() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(productId)
  const categoriesResource = useAdminResource('/admin/categories')
  const productResource = useAdminResource(
    `/admin/products?search=${encodeURIComponent(productId || '')}&limit=100`,
    { enabled: editing },
  )
  const product = productResource.data?.products?.find((item) => item.id === productId)
  const [form, setForm] = useState(blankProduct)
  const [submitError, setSubmitError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!product) return
    setForm({
      name: product.name,
      slug: product.id,
      sku: product.sku || '',
      category: product.category,
      description: product.description,
      color: product.color || '',
      image: product.image,
      label: product.label || '',
      price: String(product.price),
      stockQuantity: String(product.stockQuantity),
      isActive: Boolean(Number(product.isActive)),
    })
  }, [product])

  const categories = categoriesResource.data?.categories ?? []
  const currentCategory = categories.find((category) => category.name === form.category)
  const activeCategories = categories.filter(isActiveCategory)

  function updateField(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitError('')
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color.trim(),
      image: form.image.trim(),
      label: form.label.trim() || null,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
    }
    if (form.slug.trim()) payload.slug = form.slug.trim()
    if (form.sku.trim()) payload.sku = form.sku.trim()
    if (!editing || form.category !== product?.category) payload.category = form.category
    if (editing) payload.isActive = form.isActive

    try {
      if (editing) await api.patch(`/admin/products/${encodeURIComponent(productId)}`, payload)
      else await api.post('/admin/products', payload)
      navigate('/admin/products', { replace: true })
    } catch (requestError) {
      setSubmitError(requestError.message)
      setSaving(false)
    }
  }

  const pageError = categoriesResource.error || productResource.error
  const pageLoading = categoriesResource.loading || productResource.loading

  return (
    <div>
      <div className="mb-7">
        <Link to="/admin/products" className="text-[9px] uppercase tracking-[0.14em] text-muted hover:text-ink">← Back to products</Link>
        <p className="eyebrow mt-6">{editing ? 'Edit the collection' : 'A new addition'}</p>
        <h1 className="section-title text-4xl">{editing ? 'Refine a piece.' : 'Add a piece.'}</h1>
      </div>

      <AdminDataState
        loading={pageLoading}
        error={pageError}
        onRetry={() => { categoriesResource.reload(); productResource.reload() }}
      >
        {editing && !product ? (
          <div className="border border-ink/10 bg-white/70 px-6 py-12 text-center text-sm text-muted" role="status">This product could not be found.</div>
        ) : (
          <form onSubmit={submit} className="max-w-4xl space-y-6 border border-ink/10 bg-white/70 p-5 sm:p-8">
            {submitError && <p className="border border-red-800/20 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{submitError}</p>}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="product-name" className="form-label">Product name</label>
                <input id="product-name" name="name" value={form.name} onChange={updateField} required minLength={2} maxLength={180} className="form-input" />
              </div>
              <div>
                <label htmlFor="product-category" className="form-label">Category</label>
                <select id="product-category" name="category" value={form.category} onChange={updateField} required className="form-input">
                  <option value="">Choose a category</option>
                  {currentCategory && !isActiveCategory(currentCategory) && <option value={currentCategory.name}>{currentCategory.name} · inactive</option>}
                  {activeCategories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="product-slug" className="form-label">Product URL slug</label>
                <input id="product-slug" name="slug" value={form.slug} onChange={updateField} maxLength={160} className="form-input" placeholder="Generated from the product name if blank" />
              </div>
              <div>
                <label htmlFor="product-sku" className="form-label">SKU</label>
                <input id="product-sku" name="sku" value={form.sku} onChange={updateField} maxLength={80} className="form-input" />
              </div>
              <div>
                <label htmlFor="product-price" className="form-label">Price (USD)</label>
                <input id="product-price" name="price" type="number" step="0.01" min="0" max="100000000" value={form.price} onChange={updateField} required className="form-input" />
              </div>
              <div>
                <label htmlFor="product-stock" className="form-label">Stock quantity</label>
                <input id="product-stock" name="stockQuantity" type="number" step="1" min="0" max="10000000" value={form.stockQuantity} onChange={updateField} required className="form-input" />
              </div>
              <div>
                <label htmlFor="product-color" className="form-label">Color</label>
                <input id="product-color" name="color" value={form.color} onChange={updateField} maxLength={100} className="form-input" />
              </div>
              <div>
                <label htmlFor="product-label" className="form-label">Collection label</label>
                <input id="product-label" name="label" value={form.label} onChange={updateField} maxLength={60} className="form-input" placeholder="e.g. NEW ARRIVAL" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="product-image" className="form-label">Image URL</label>
                <input id="product-image" name="image" type="url" value={form.image} onChange={updateField} required maxLength={2048} className="form-input" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="product-description" className="form-label">Description</label>
                <textarea id="product-description" name="description" value={form.description} onChange={updateField} required minLength={5} maxLength={10000} rows={5} className="form-input resize-y" />
              </div>
              {editing && (
                <label className="flex items-center gap-3 text-xs sm:col-span-2">
                  <input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} className="accent-gold" />
                  Visible in the storefront
                </label>
              )}
            </div>
            <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-5">
              <button type="submit" disabled={saving} className="bg-ink px-6 py-3 text-[9px] uppercase tracking-[0.15em] text-ivory transition hover:bg-gold disabled:opacity-50">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}</button>
              <Link to="/admin/products" className="border border-ink/20 px-6 py-3 text-[9px] uppercase tracking-[0.15em] text-muted hover:border-ink hover:text-ink">Cancel</Link>
            </div>
          </form>
        )}
      </AdminDataState>
    </div>
  )
}
