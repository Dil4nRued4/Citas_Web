import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const { login, loading, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState<string>(location.state?.notice ?? '')
  const [remember, setRemember] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    const data = new FormData(event.currentTarget)
    setSubmitting(true)
    try {
      await login(String(data.get('email')), String(data.get('password')), remember)
      navigate('/dashboard', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      panelAction="¡Inicia sesión para comenzar!"
      panelMessage="Bienvenido al sistema de agendamiento de citas"
    >
      <h1 className="auth-title">Iniciar sesión</h1>
      <p className="auth-subtitle">Si no tienes una cuenta, regístrate</p>
      <p className="auth-register-line">
        Puedes <Link to="/register">registrarte aquí</Link>
      </p>

      <form className="auth-form login-form" onSubmit={handleSubmit}>
        <FormField
          autoComplete="email"
          id="email"
          label="Correo electrónico"
          placeholder="Ingresa tu correo electrónico"
          type="email"
        />
        <FormField
          autoComplete="current-password"
          id="password"
          label="Contraseña"
          minLength={8}
          placeholder="Ingresa tu contraseña"
          showPasswordLabel="Mostrar contraseña"
          hidePasswordLabel="Ocultar contraseña"
          type="password"
        />
        <div className="form-options">
          <label className="remember-option">
            <input
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              type="checkbox"
            />
            <span>Recuérdame</span>
          </label>
          <button
            className="forgot-link"
            onClick={() => setNotice('La recuperación de contraseña aún no está disponible.')}
            type="button"
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        {notice && <p className="form-notice" role="status">{notice}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button login-button" disabled={submitting} type="submit">
          {submitting ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
      </form>
    </AuthLayout>
  )
}
