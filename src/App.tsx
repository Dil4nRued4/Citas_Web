import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider'
import { useAuth } from './auth/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { AppointmentsPage } from './pages/AppointmentsPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin" element={<AppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['PROFESSIONAL']} />}>
            <Route path="/professional" element={<AppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['PATIENT']} />}>
            <Route path="/patient" element={<AppointmentsPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<HomeRedirect />} />
            <Route path="/" element={<HomeRedirect />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function HomeRedirect() {
  const { user } = useAuth()
  const home = user?.role === 'ADMIN' ? '/admin' : user?.role === 'PROFESSIONAL' ? '/professional' : '/patient'
  return <Navigate to={home} replace />
}
