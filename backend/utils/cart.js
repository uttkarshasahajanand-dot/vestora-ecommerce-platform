import { createHash } from 'node:crypto'
import HttpError from './HttpError.js'

export function normalizeMergeItems(items) {
  const combined = new Map()
  for (const item of items) {
    const key = JSON.stringify([item.productId, item.size])
    const quantity = (combined.get(key)?.quantity ?? 0) + item.quantity
    if (quantity > 1000) throw new HttpError(400, 'A cart line cannot exceed 1000 items')
    combined.set(key, { productId: item.productId, size: item.size, quantity })
  }
  return [...combined.values()].sort((left, right) => (
    left.productId.localeCompare(right.productId) || left.size.localeCompare(right.size)
  ))
}

export function hashCartMutation(operation, items) {
  return createHash('sha256')
    .update(JSON.stringify({ operation, items }))
    .digest('hex')
}
