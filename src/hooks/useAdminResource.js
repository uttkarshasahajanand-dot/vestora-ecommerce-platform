import { useCallback, useEffect, useState } from 'react'
import api from '../services/api.js'

export default function useAdminResource(path, { enabled = true } = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!enabled || !path) {
      setData(null)
      setLoading(false)
      setError('')
      return undefined
    }

    const controller = new AbortController()
    setData(null)
    setLoading(true)
    setError('')

    api.get(path, { signal: controller.signal })
      .then(setData)
      .catch((requestError) => {
        if (!controller.signal.aborted) setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [enabled, path, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])
  return { data, setData, loading, error, reload }
}
