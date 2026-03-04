import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Loading } from '@/components/common/Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { currentUser, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <Loading />
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

