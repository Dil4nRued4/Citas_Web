import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'
import { useAuth } from '../auth/useAuth'

export function RegisterPage() {
  const { loading, register, user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    const data = new FormData(event.currentTarget)
    const password = String(data.get('password'))
    if (password !== String(data.get('confirmPassword'))) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await register(String(data.get('name')), String(data.get('email')), password)
      navigate('/login', { replace: true, state: { notice: 'Account created. Please sign in.' } })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create account')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      panelAction="Regístrate para comenzar!"
      panelMessage="Crea tu cuenta en el sistema de agendamiento de citas"
    >
      <h1 className="auth-title">Create account</h1>
      <p className="auth-subtitle">If you already have an account</p>
      <p className="auth-register-line">
        You can <Link to="/login">Login here !</Link>
      </p>

      <form className="auth-form register-form" onSubmit={handleSubmit}>
        <FormField autoComplete="name" id="name" label="Name" placeholder="Enter your name" />
        <FormField
          autoComplete="email"
          id="email"
          label="Email"
          placeholder="Enter your email address"
          type="email"
        />
        <FormField
          autoComplete="new-password"
          id="password"
          label="Password"
          minLength={8}
          placeholder="Enter your Password"
          type="password"
        />
        <FormField
          autoComplete="new-password"
          id="confirmPassword"
          label="Confirm password"
          minLength={8}
          placeholder="Confirm your Password"
          type="password"
        />
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button register-button" disabled={submitting} type="submit">
          {submitting ? 'Creating account…' : 'Register'}
        </button>
      </form>
    </AuthLayout>
  )
}
