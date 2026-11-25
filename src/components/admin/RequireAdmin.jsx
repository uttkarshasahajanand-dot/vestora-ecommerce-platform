import { Navigate, Outlet } from 'react-router-dom'
import LoadingSpinner from '../LoadingSpinner.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function RequireAdmin() {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner label="Verifying administrator access" />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}
