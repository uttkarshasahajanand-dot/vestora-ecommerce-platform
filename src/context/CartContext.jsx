import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api, { ApiError } from '../services/api.js'
import { useAuth } from './AuthContext.jsx'

const CartContext = createContext(null)
const GUEST_CART_KEY = 'vestora-cart'
const ADD_KEYS_KEY = 'vestora-cart-add-keys'

function createRequestKey() {
  if (typeof globalThis.crypto?.randomUUID !== 'function') {
    throw new Error('This browser cannot create a secure cart request key. Update your browser and try again.')
  }
  return globalThis.crypto.randomUUID()
}

function normalizeCartItem(item) {
  const price = Number(item?.price)
  const quantity = Number(item?.quantity)
  const stockQuantity = item?.stockQuantity == null ? null : Number(item.stockQuantity)

  if (
    !item
    || typeof item.id !== 'string'
    || typeof item.name !== 'string'
    || typeof item.size !== 'string'
    || !Number.isFinite(price)
    || price < 0
    || !Number.isInteger(quantity)
    || quantity < 1
    || (stockQuantity !== null && (!Number.isInteger(stockQuantity) || stockQuantity < 0))
  ) {
    throw new ApiError('The cart contains an invalid item. Please refresh the page and try again.', {
      code: 'INVALID_CART',
    })
  }

  return { ...item, price, quantity, stockQuantity }
}

function readGuestCart() {
  let stored
  try {
    stored = localStorage.getItem(GUEST_CART_KEY)
  } catch (cause) {
    throw new ApiError('The saved guest bag is unavailable in this browser.', {
      code: 'CART_STORAGE_ERROR',
      cause,
    })
  }
  if (!stored) return []

  try {
    const items = JSON.parse(stored)
    if (!Array.isArray(items)) throw new Error('Saved cart is not a list')
    return items.map(normalizeCartItem)
  } catch (cause) {
    if (cause instanceof ApiError) throw cause
    throw new ApiError('The saved guest bag could not be read. Clear the browser cart storage and try again.', {
      code: 'INVALID_CART',
      cause,
    })
  }
}

function writeGuestCart(items) {
  try {
    if (items.length) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items))
    else localStorage.removeItem(GUEST_CART_KEY)
  } catch (cause) {
    throw new ApiError('The guest bag could not be saved in this browser.', {
      code: 'CART_STORAGE_ERROR',
      cause,
    })
  }
}

function guestSubtotal(items) {
  return items.reduce((total, item) => total + item.price * item.quantity, 0)
}

function getPendingAddKey(userId, productId, size) {
  const identity = JSON.stringify([userId, productId, size])
  let entries
  try {
    entries = JSON.parse(sessionStorage.getItem(ADD_KEYS_KEY) || '{}')
  } catch (cause) {
    throw new ApiError('A pending cart request could not be read. Please refresh and try again.', {
      code: 'CART_STORAGE_ERROR',
      cause,
    })
  }
  if (!entries || typeof entries !== 'object' || Array.isArray(entries)) {
    throw new ApiError('A pending cart request is invalid. Please refresh and try again.', {
      code: 'INVALID_CART',
    })
  }
  if (typeof entries[identity] === 'string') return entries[identity]

  const requestKey = createRequestKey()
  entries[identity] = requestKey
  try {
    sessionStorage.setItem(ADD_KEYS_KEY, JSON.stringify(entries))
  } catch (cause) {
    throw new ApiError('The cart request could not be saved safely. Enable browser session storage and try again.', {
      code: 'CART_STORAGE_ERROR',
      cause,
    })
  }
  return requestKey
}

function clearPendingAddKey(userId, productId, size) {
  const identity = JSON.stringify([userId, productId, size])
  try {
    const entries = JSON.parse(sessionStorage.getItem(ADD_KEYS_KEY) || '{}')
    delete entries[identity]
    sessionStorage.setItem(ADD_KEYS_KEY, JSON.stringify(entries))
  } catch (cause) {
    throw new ApiError('The completed cart request key could not be cleared from this browser.', {
      code: 'CART_STORAGE_ERROR',
      cause,
    })
  }
}

function mergeStorageKey(userId) {
  return `vestora-cart-merge:${userId}`
}

function readOrCreateMergeRequest(userId, items) {
  const storageKey = mergeStorageKey(userId)
  let saved
  try {
    const raw = localStorage.getItem(storageKey)
    saved = raw ? JSON.parse(raw) : null
  } catch (cause) {
    throw new ApiError('The pending guest-bag merge could not be read safely.', {
      code: 'CART_STORAGE_ERROR',
      cause,
    })
  }

  if (saved) {
    if (
      typeof saved.requestKey !== 'string'
      || !Array.isArray(saved.items)
      || saved.items.some((item) => typeof item?.productId !== 'string' || typeof item?.size !== 'string' || !Number.isInteger(item?.quantity))
    ) {
      throw new ApiError('The pending guest-bag merge is invalid. Please contact support before retrying.', {
        code: 'INVALID_CART',
      })
    }
    return saved
  }

  const request = {
    requestKey: createRequestKey(),
    items: items.map(({ id, size, quantity }) => ({ productId: id, size, quantity })),
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(request))
  } catch (cause) {
    throw new ApiError('The guest-bag merge could not be saved safely. Enable browser storage and try again.', {
      code: 'CART_STORAGE_ERROR',
      cause,
    })
  }
  return request
}

function clearMergeRequest(userId) {
  try {
    localStorage.removeItem(mergeStorageKey(userId))
  } catch (cause) {
    throw new ApiError('The completed guest-bag merge key could not be cleared from this browser.', {
      code: 'CART_STORAGE_ERROR',
      cause,
    })
  }
}

function removeMergedQuantities(currentItems, mergedItems) {
  const remaining = currentItems.map((item) => ({ ...item }))
  for (const merged of mergedItems) {
    const index = remaining.findIndex((item) => item.id === merged.productId && item.size === merged.size)
    if (index < 0) continue
    remaining[index].quantity -= merged.quantity
    if (remaining[index].quantity <= 0) remaining.splice(index, 1)
  }
  return remaining
}

function normalizeServerCart(payload) {
  const subtotal = Number(payload?.subtotal)
  const itemCount = Number(payload?.itemCount)
  if (
    !Array.isArray(payload?.items)
    || !Number.isFinite(subtotal)
    || subtotal < 0
    || !Number.isInteger(itemCount)
    || itemCount < 0
  ) {
    throw new ApiError('The server returned an invalid cart. Please try again.', { code: 'INVALID_RESPONSE' })
  }
  return {
    items: payload.items.map(normalizeCartItem),
    subtotal,
    itemCount,
  }
}

function isAmbiguousFailure(error) {
  return !error.status || error.status >= 500
}

export function CartProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth()
  const userId = user?.id ?? null
  const [items, setItems] = useState([])
  const [cartOwnerId, setCartOwnerId] = useState(null)
  const [subtotalValue, setSubtotalValue] = useState(0)
  const [itemCountValue, setItemCountValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMutating, setIsMutating] = useState(false)
  const [error, setError] = useState('')
  const [canRetry, setCanRetry] = useState(false)
  const [mergeFailed, setMergeFailed] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const ownerRef = useRef(null)
  const mutationLockRef = useRef(false)
  const retryActionRef = useRef(null)

  const acceptServerCart = useCallback((payload, owner) => {
    const cart = normalizeServerCart(payload)
    if (ownerRef.current !== owner) return false
    setItems(cart.items)
    setSubtotalValue(cart.subtotal)
    setItemCountValue(cart.itemCount)
    setCartOwnerId(owner)
    setMergeFailed(false)
    return true
  }, [])

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true)
      return undefined
    }

    const controller = new AbortController()
    let active = true
    let mergingGuestBag = false
    ownerRef.current = userId
    setIsLoading(true)
    setError('')
    setCanRetry(false)
    setMergeFailed(false)
    retryActionRef.current = null
    setCartOwnerId(null)
    setItems([])
    setSubtotalValue(0)
    setItemCountValue(0)

    const stillCurrent = () => active && ownerRef.current === userId

    async function loadCart() {
      try {
        if (!userId) {
          const guestItems = readGuestCart()
          if (!stillCurrent()) return
          setItems(guestItems)
          setSubtotalValue(guestSubtotal(guestItems))
          setItemCountValue(guestItems.reduce((total, item) => total + item.quantity, 0))
          setCartOwnerId(null)
          setIsLoading(false)
          return
        }

        let guestItems = readGuestCart()
        while (guestItems.length) {
          mergingGuestBag = true
          const request = readOrCreateMergeRequest(userId, guestItems)
          await api.post(
            '/cart/merge',
            { items: request.items },
            { headers: { 'Idempotency-Key': request.requestKey }, signal: controller.signal },
          )
          if (!stillCurrent()) return

          const currentGuestItems = readGuestCart()
          const remaining = removeMergedQuantities(currentGuestItems, request.items)
          writeGuestCart(remaining)
          clearMergeRequest(userId)
          guestItems = remaining
        }

        mergingGuestBag = false
        const cart = await api.get('/cart', { signal: controller.signal })
        if (!stillCurrent()) return
        acceptServerCart(cart, userId)
        setIsLoading(false)
      } catch (requestError) {
        if (!stillCurrent()) return
        setError(requestError.message || 'The shopping bag could not be loaded.')
        setCanRetry(true)
        retryActionRef.current = () => setReloadKey((key) => key + 1)
        if (mergingGuestBag) {
          const idempotencyConflict = requestError.message?.startsWith('This Idempotency-Key')
          if (requestError.status >= 400 && requestError.status < 500 && !idempotencyConflict) {
            try {
              clearMergeRequest(userId)
            } catch (storageError) {
              setError(`${requestError.message} ${storageError.message}`)
              setItems([])
              setSubtotalValue(0)
              setItemCountValue(0)
              setCartOwnerId(userId)
            }
          } else if (userId) {
            setItems([])
            setSubtotalValue(0)
            setItemCountValue(0)
            setCartOwnerId(userId)
          }
          try {
            const guestItems = readGuestCart()
            setItems(guestItems)
            setSubtotalValue(guestSubtotal(guestItems))
            setItemCountValue(guestItems.reduce((total, item) => total + item.quantity, 0))
            setCartOwnerId(userId)
            setMergeFailed(true)
          } catch (storageError) {
            setError(`${requestError.message} ${storageError.message}`)
            setItems([])
            setSubtotalValue(0)
            setItemCountValue(0)
            setCartOwnerId(userId)
          }
        }
        setIsLoading(false)
      }
    }

    loadCart()
    return () => {
      active = false
      controller.abort()
    }
  }, [acceptServerCart, authLoading, reloadKey, userId])

  const runServerMutation = useCallback(async (action, owner, onSuccess, onDefiniteFailure) => {
    if (mutationLockRef.current || ownerRef.current !== owner) return false
    mutationLockRef.current = true
    setIsMutating(true)
    setError('')
    setCanRetry(false)

    try {
      const payload = await action()
      if (ownerRef.current !== owner) return false
      const accepted = acceptServerCart(payload, owner)
      if (accepted) {
        retryActionRef.current = null
        onSuccess?.()
      }
      return accepted
    } catch (requestError) {
      if (ownerRef.current === owner) {
        setError(requestError.message || 'The shopping bag could not be updated.')
        if (isAmbiguousFailure(requestError)) {
          retryActionRef.current = () => runServerMutation(action, owner, onSuccess, onDefiniteFailure)
          setCanRetry(true)
        } else {
          retryActionRef.current = null
          try {
            onDefiniteFailure?.()
          } catch (storageError) {
            setError(`${requestError.message || 'The cart request failed.'} ${storageError.message}`)
          }
        }
      }
      return false
    } finally {
      mutationLockRef.current = false
      setIsMutating(false)
    }
  }, [acceptServerCart])

  const addToCart = useCallback(async (product, size = 'One size') => {
    const usingGuestBag = !userId || mergeFailed
    const currentItems = cartOwnerId === userId ? items : []
    if (authLoading || isLoading || mutationLockRef.current || (!usingGuestBag && cartOwnerId !== userId)) return false

    const stockQuantity = product?.stockQuantity == null ? null : Number(product.stockQuantity)
    const existing = currentItems.find((item) => item.id === product?.id && item.size === size)
    if (stockQuantity !== null && (!Number.isInteger(stockQuantity) || stockQuantity < 0)) {
      setError('This piece has an invalid stock value. Refresh the collection and try again.')
      setCanRetry(false)
      return false
    }
    if (stockQuantity !== null && (existing?.quantity ?? 0) + 1 > stockQuantity) {
      setError(stockQuantity === 0 ? 'This piece is currently out of stock.' : `Only ${stockQuantity} item(s) are currently available.`)
      setCanRetry(false)
      return false
    }

    if (usingGuestBag) {
      try {
        const nextItems = existing
          ? currentItems.map((item) => item.id === product.id && item.size === size
            ? { ...item, quantity: item.quantity + 1, ...product }
            : item)
          : [...currentItems, normalizeCartItem({ ...product, size, quantity: 1 })]
        writeGuestCart(nextItems)
        setItems(nextItems)
        setSubtotalValue(guestSubtotal(nextItems))
        setItemCountValue(nextItems.reduce((total, item) => total + item.quantity, 0))
        setCartOwnerId(userId)
        setError('')
        setCanRetry(false)
        if (userId) setReloadKey((key) => key + 1)
        return true
      } catch (storageError) {
        setError(storageError.message)
        setCanRetry(false)
        return false
      }
    }

    let requestKey
    try {
      requestKey = getPendingAddKey(userId, product.id, size)
    } catch (keyError) {
      setError(keyError.message)
      setCanRetry(false)
      return false
    }
    const clearKey = () => clearPendingAddKey(userId, product.id, size)
    return runServerMutation(
      () => api.post('/cart/items', {
        productId: product.id,
        size,
        quantity: 1,
      }, { headers: { 'Idempotency-Key': requestKey } }),
      userId,
      clearKey,
      clearKey,
    )
  }, [authLoading, cartOwnerId, isLoading, items, mergeFailed, runServerMutation, userId])

  const removeFromCart = useCallback(async (id, size) => {
    const usingGuestBag = !userId || mergeFailed
    const currentItems = cartOwnerId === userId ? items : []
    if (authLoading || isLoading || mutationLockRef.current || (!usingGuestBag && cartOwnerId !== userId)) return false

    if (usingGuestBag) {
      const nextItems = currentItems.filter((item) => !(item.id === id && item.size === size))
      try {
        writeGuestCart(nextItems)
        setItems(nextItems)
        setSubtotalValue(guestSubtotal(nextItems))
        setItemCountValue(nextItems.reduce((total, item) => total + item.quantity, 0))
        setError('')
        setCanRetry(false)
        if (userId) setReloadKey((key) => key + 1)
        return true
      } catch (storageError) {
        setError(storageError.message)
        return false
      }
    }

    return runServerMutation(
      () => api.delete(`/cart/items/${encodeURIComponent(id)}?size=${encodeURIComponent(size)}`),
      userId,
    )
  }, [authLoading, cartOwnerId, isLoading, items, mergeFailed, runServerMutation, userId])

  const updateQuantity = useCallback(async (id, size, quantity) => {
    if (quantity < 1) return removeFromCart(id, size)
    const usingGuestBag = !userId || mergeFailed
    const currentItems = cartOwnerId === userId ? items : []
    if (authLoading || isLoading || mutationLockRef.current || (!usingGuestBag && cartOwnerId !== userId)) return false
    const item = currentItems.find((entry) => entry.id === id && entry.size === size)
    if (!item) return false
    if (item.stockQuantity !== null && quantity > item.stockQuantity) {
      setError(`Only ${item.stockQuantity} item(s) are currently available.`)
      setCanRetry(false)
      return false
    }

    if (usingGuestBag) {
      const nextItems = currentItems.map((entry) => entry.id === id && entry.size === size
        ? { ...entry, quantity }
        : entry)
      try {
        writeGuestCart(nextItems)
        setItems(nextItems)
        setSubtotalValue(guestSubtotal(nextItems))
        setItemCountValue(nextItems.reduce((total, entry) => total + entry.quantity, 0))
        setError('')
        setCanRetry(false)
        if (userId) setReloadKey((key) => key + 1)
        return true
      } catch (storageError) {
        setError(storageError.message)
        return false
      }
    }

    return runServerMutation(
      () => api.patch(`/cart/items/${encodeURIComponent(id)}`, { size, quantity }),
      userId,
    )
  }, [authLoading, cartOwnerId, isLoading, items, mergeFailed, removeFromCart, runServerMutation, userId])

  const retry = useCallback(() => {
    if (retryActionRef.current) return retryActionRef.current()
    setReloadKey((key) => key + 1)
    return undefined
  }, [])

  const refreshCart = useCallback(() => {
    retryActionRef.current = null
    setReloadKey((key) => key + 1)
  }, [])

  const clearError = useCallback(() => {
    setError('')
    setCanRetry(false)
  }, [])

  const isCurrentOwner = cartOwnerId === userId
  const value = useMemo(() => ({
    items: isCurrentOwner ? items : [],
    itemCount: isCurrentOwner ? itemCountValue : 0,
    subtotal: isCurrentOwner ? subtotalValue : 0,
    isLoading: authLoading || isLoading || !isCurrentOwner,
    isMutating,
    error,
    canRetry,
    mergeFailed,
    addToCart,
    updateQuantity,
    removeFromCart,
    retry,
    refreshCart,
    clearError,
  }), [
    addToCart,
    authLoading,
    canRetry,
    clearError,
    error,
    isCurrentOwner,
    isLoading,
    isMutating,
    items,
    itemCountValue,
    mergeFailed,
    removeFromCart,
    retry,
    refreshCart,
    subtotalValue,
    updateQuantity,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
