import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

type Role = 'ADMIN' | 'PROFESSIONAL' | 'PATIENT'

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { loading, user } = useAuth()
  if (loading) return <main className="session-loading" aria-live="polite">Loading…</main>
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) {
    const home = user.role === 'ADMIN' ? '/admin' : user.role === 'PROFESSIONAL' ? '/professional' : '/patient'
    return <Navigate to={home} replace />
  }
  return <Outlet />
}
