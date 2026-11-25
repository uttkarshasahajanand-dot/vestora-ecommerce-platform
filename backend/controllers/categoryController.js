import * as Category from '../models/Category.js'
import { slugify } from '../utils/slugify.js'
import HttpError from '../utils/HttpError.js'

export async function listCategories(request, response) {
  const categories = await Category.listCategories()
  return response.json({ categories })
}

export async function listAdminCategories(request, response) {
  const categories = await Category.listCategories({ includeInactive: true })
  return response.json({ categories })
}

export async function createCategory(request, response) {
  const { name, description } = request.body
  const slug = slugify(request.body.slug || name)
  if (!slug) throw new HttpError(400, 'Category name must produce a valid slug')
  const category = await Category.createCategory({ name, slug, description })
  return response.status(201).json({ category })
}

export async function updateCategory(request, response) {
  const body = { ...request.body }
  if (body.slug !== undefined) {
    body.slug = slugify(body.slug)
    if (!body.slug) throw new HttpError(400, 'Category slug is invalid')
  }
  const category = await Category.updateCategory(request.params.categoryId, body)
  if (!category) throw new HttpError(404, 'Category not found')
  return response.json({ category })
}

export async function deleteCategory(request, response) {
  await Category.deactivateCategory(request.params.categoryId)
  return response.json({ message: 'Category deactivated' })
}
