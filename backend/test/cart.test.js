import test from 'node:test'
import assert from 'node:assert/strict'
import { hashCartMutation, normalizeMergeItems } from '../utils/cart.js'

test('cart merge normalization combines duplicate lines and sorts them', () => {
  const normalized = normalizeMergeItems([
    { productId: 'forma-coat', size: 'M', quantity: 1 },
    { productId: 'noa-tote', size: 'One size', quantity: 2 },
    { productId: 'forma-coat', size: 'M', quantity: 3 },
  ])

  assert.deepEqual(normalized, [
    { productId: 'forma-coat', size: 'M', quantity: 4 },
    { productId: 'noa-tote', size: 'One size', quantity: 2 },
  ])
})

test('cart merge idempotency hash is stable for equivalent normalized input', () => {
  const first = normalizeMergeItems([
    { productId: 'noa-tote', size: 'One size', quantity: 1 },
    { productId: 'forma-coat', size: 'M', quantity: 2 },
  ])
  const retry = normalizeMergeItems([
    { productId: 'forma-coat', size: 'M', quantity: 2 },
    { productId: 'noa-tote', size: 'One size', quantity: 1 },
  ])

  assert.equal(hashCartMutation('merge', first), hashCartMutation('merge', retry))
  assert.notEqual(hashCartMutation('merge', first), hashCartMutation('add', first))
})

test('cart merge rejects aggregated line quantities above the API limit', () => {
  assert.throws(
    () => normalizeMergeItems([
      { productId: 'forma-coat', size: 'M', quantity: 600 },
      { productId: 'forma-coat', size: 'M', quantity: 401 },
    ]),
    { status: 400 },
  )
})
