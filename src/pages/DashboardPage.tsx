import { useState } from 'react'
import { useAuth } from '../auth/useAuth'

export function DashboardPage() {
  const { logout, user } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleLogout() {
    setError('')
    setSubmitting(true)
    try {
      await logout()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to contact the API')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="dashboard">
      <section className="dashboard-card">
        <p className="dashboard-eyebrow">Protected route</p>
        <h1>Bienvenido, {user?.name}</h1>
        <p className="dashboard-email">{user?.email}</p>
        <p>Tu sesión está autenticada.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button dashboard-button" disabled={submitting} onClick={() => void handleLogout()}>
          {submitting ? 'Signing out…' : 'Logout'}
        </button>
      </section>
    </main>
  )
}
