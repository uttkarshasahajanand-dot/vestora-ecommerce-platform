import * as Cart from '../models/Cart.js'

export async function getCart(request, response) {
  return response.json(await Cart.getCart(request.user.id))
}

export async function addItem(request, response) {
  const cart = await Cart.addItem(request.user.id, {
    productId: request.body.productId,
    size: request.body.size ?? 'One size',
    quantity: request.body.quantity ?? 1,
  }, request.get('idempotency-key').toLowerCase())
  return response.status(201).json(cart)
}

export async function mergeItems(request, response) {
  const cart = await Cart.mergeItems(
    request.user.id,
    request.body.items,
    request.get('idempotency-key').toLowerCase(),
  )
  return response.json(cart)
}

export async function updateItem(request, response) {
  const cart = await Cart.updateItem(
    request.user.id,
    request.params.productId,
    request.body.size ?? 'One size',
    request.body.quantity,
  )
  return response.json(cart)
}

export async function removeItem(request, response) {
  const cart = await Cart.removeItem(
    request.user.id,
    request.params.productId,
    request.query.size ?? 'One size',
  )
  return response.json(cart)
}
