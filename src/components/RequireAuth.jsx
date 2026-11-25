import { Navigate, Outlet, useLocation } from 'react-router-dom'
import LoadingSpinner from './LoadingSpinner.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAuth() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingSpinner label="Verifying your account" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
