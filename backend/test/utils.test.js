import test from 'node:test'
import assert from 'node:assert/strict'
import { getPagination, paginationMeta } from '../utils/pagination.js'
import { slugify } from '../utils/slugify.js'
import { onlyAllowedKeys } from '../utils/validation.js'

test('slugify normalizes names for product and category IDs', () => {
  assert.equal(slugify('  Café & Silk — Edit  '), 'cafe-silk-edit')
})

test('pagination applies defaults and caps the requested page size', () => {
  assert.deepEqual(getPagination({}), { page: 1, limit: 20, offset: 0 })
  assert.deepEqual(getPagination({ page: '3', limit: '500' }), { page: 3, limit: 100, offset: 200 })
})

test('pagination metadata reports the final partial page', () => {
  assert.deepEqual(paginationMeta(2, 20, 21), { page: 2, limit: 20, total: 21, totalPages: 2 })
})

test('body allowlists reject role escalation and non-object input', () => {
  assert.equal(onlyAllowedKeys({ name: 'Customer', email: 'customer@example.com' }, ['name', 'email']), true)
  assert.equal(onlyAllowedKeys({ name: 'Customer', role: 'admin' }, ['name', 'email']), false)
  assert.equal(onlyAllowedKeys(['unexpected'], ['name']), false)
})
