import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AuthContext, type AuthContextValue } from '../auth/auth-context'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { PatientHome } from '../components/PatientHome'
import { SlotGrid } from '../components/SlotGrid'
import { AppointmentsPage } from '../pages/AppointmentsPage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { appointmentApi, authStorage, type Appointment, type AvailableSlot, type Professional, type Specialty, type User } from '../services/api'

const patient: User = { id: 2, name: 'Paciente Demo', email: 'patient@example.com', role: 'PATIENT' }
const cardiology: Specialty = { id: 2, name: 'Cardiología', durationMinutes: 60, category: 'ESPECIALISTA' }
const doctor: Professional = {
  id: 8,
  name: 'Dra. Elena Demo',
  type: 'ESPECIALISTA',
  description: 'Atención cardiológica',
  active: true,
  specialties: [cardiology],
  sites: [{ id: 1, code: 'TEST', name: 'Clínica Demo', address: 'Dirección demo' }],
}

afterEach(cleanup)
afterEach(() => vi.unstubAllGlobals())
afterEach(() => {
  authStorage.clear()
  vi.restoreAllMocks()
})

function renderWithAuth(element: ReactNode, user: User | null = null, path = '/') {
  const auth: AuthContextValue = {
    user,
    loading: false,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn().mockResolvedValue(undefined),
  }
  return render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('authentication forms', () => {
  it('renders labelled login fields and recovery message', async () => {
    const user = userEvent.setup()
    renderWithAuth(<LoginPage />)
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeTruthy()
    expect(screen.getByText('Si no tienes una cuenta, regístrate')).toBeTruthy()
    expect(screen.getByLabelText('Correo electrónico')).toBeTruthy()
    expect(screen.getByLabelText('Contraseña')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mostrar contraseña' })).toBeTruthy()
    expect(screen.getByText('Recuérdame')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' }))
    expect(screen.getByRole('status').textContent).toContain('La recuperación de contraseña aún no está disponible.')
  })

  it('blocks registration when password confirmation differs', async () => {
    const user = userEvent.setup()
    renderWithAuth(<RegisterPage />)
    await user.type(screen.getByLabelText('Name'), 'Demo User')
    await user.type(screen.getByLabelText('Email'), 'demo@example.com')
    await user.type(screen.getByLabelText('Password'), 'Strong-password-1')
    await user.type(screen.getByLabelText('Confirm password'), 'different-password')
    await user.click(screen.getByRole('button', { name: 'Register' }))
    expect(screen.getByRole('alert').textContent).toBe('Passwords do not match')
  })
})

describe('role guard and availability slots', () => {
  it.each([
    ['/api/catalog/specialties', (accessToken: string) => appointmentApi.specialties(accessToken)],
    ['/api/catalog/sites', (accessToken: string) => appointmentApi.sites(accessToken)],
  ])('sends the access token when requesting %s', async (path, fetchCatalog) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '[]',
    })
    vi.stubGlobal('fetch', fetchMock)

    await fetchCatalog('test-access-token')

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, request] = fetchMock.mock.calls[0]
    expect(url).toBe(`http://localhost:8080${path}`)
    expect(new Headers(request.headers).get('Authorization')).toBe('Bearer test-access-token')
  })

  it('redirects a patient away from the admin route', () => {
    renderWithAuth(
      <Routes>
        <Route element={<ProtectedRoute roles={['ADMIN']} />} path="/admin"><Route element={<p>Admin view</p>} index /></Route>
        <Route element={<p>Patient view</p>} path="/patient" />
      </Routes>,
      patient,
      '/admin',
    )
    expect(screen.getByText('Patient view')).toBeTruthy()
  })

  describe('patient home', () => {
    it('shows the authenticated greeting and real catalog entries', () => {
      render(<PatientHome
        user={patient}
        specialties={[cardiology]}
        professionals={[doctor]}
        appointments={[]}
        query=""
        activeTab="home"
        onQueryChange={vi.fn()}
        onTabChange={vi.fn()}
        onSelectSpecialty={vi.fn()}
        onSelectProfessional={vi.fn()}
      />)

      expect(screen.getByRole('heading', { name: 'Hola, Paciente!' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Cardiología' })).toBeTruthy()
      expect(screen.getByText('Horarios por consultar')).toBeTruthy()
      expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeTruthy()
    })

    it('opens the booking flow from a doctor card', async () => {
      const user = userEvent.setup()
      const onSelectProfessional = vi.fn()
      render(<PatientHome
        user={patient}
        specialties={[cardiology]}
        professionals={[doctor]}
        appointments={[]}
        query=""
        activeTab="home"
        onQueryChange={vi.fn()}
        onTabChange={vi.fn()}
        onSelectSpecialty={vi.fn()}
        onSelectProfessional={onSelectProfessional}
      />)

      await user.click(screen.getByRole('button', { name: 'Agendar con Dra. Elena Demo' }))
      expect(onSelectProfessional).toHaveBeenCalledWith(doctor)
    })
  })

  it('returns the chosen open slot to the booking flow', () => {
    const onSelect = vi.fn()
    const slot: AvailableSlot = {
      professionalId: 8,
      professionalName: 'Dra. Demo',
      specialtyId: 2,
      specialtyName: 'Cardiología',
      siteId: 1,
      siteName: 'Clínica Demo',
      startsAt: '2026-10-05T10:00:00Z',
      endsAt: '2026-10-05T10:30:00Z',
      durationMinutes: 30,
      appointmentType: 'ESPECIALISTA',
    }
    const { rerender } = render(<SlotGrid slots={[slot]} onSelect={onSelect} />)
    const slotButton = screen.getByRole('button')
    fireEvent.click(slotButton)
    expect(onSelect).toHaveBeenCalledWith(slot)
    rerender(<SlotGrid slots={[slot]} selectedStartsAt={slot.startsAt} onSelect={onSelect} />)
    expect(screen.getByRole('button').getAttribute('aria-pressed')).toBe('true')
  })
})

describe('patient booking and appointment list', () => {
  it('shows a newly booked appointment in Mis citas with its pending status', async () => {
    const user = userEvent.setup()
    const scheduledDate = new Date()
    scheduledDate.setDate(scheduledDate.getDate() + 8)
    while (scheduledDate.getDay() === 0 || scheduledDate.getDay() === 6) {
      scheduledDate.setDate(scheduledDate.getDate() + 1)
    }
    const day = `${scheduledDate.getFullYear()}-${String(scheduledDate.getMonth() + 1).padStart(2, '0')}-${String(scheduledDate.getDate()).padStart(2, '0')}`
    const startsAt = new Date(`${day}T07:00:00-05:00`).toISOString()
    const slot: AvailableSlot = {
      professionalId: doctor.id,
      professionalName: doctor.name,
      specialtyId: cardiology.id,
      specialtyName: cardiology.name,
      siteId: 1,
      siteName: 'Clínica Demo',
      startsAt,
      endsAt: new Date(new Date(startsAt).getTime() + 60 * 60 * 1000).toISOString(),
      durationMinutes: 60,
      appointmentType: 'ESPECIALISTA',
    }
    const appointments: Appointment[] = []
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(String(input))
      let body: unknown = []
      if (url.pathname === '/api/catalog/specialties') body = [cardiology]
      else if (url.pathname === '/api/catalog/sites') body = doctor.sites
      else if (url.pathname === '/api/professionals') body = [doctor]
      else if (url.pathname === '/api/availability') body = [slot]
      else if (url.pathname === '/api/appointments/mine') body = appointments
      else if (url.pathname === '/api/appointments' && init?.method === 'POST') {
        const request = JSON.parse(String(init.body)) as { startsAt: string }
        const booked: Appointment = {
          id: 17,
          patientId: patient.id,
          professionalId: doctor.id,
          professionalName: doctor.name,
          specialtyId: cardiology.id,
          specialtyName: cardiology.name,
          siteId: 1,
          siteName: 'Clínica Demo',
          type: 'ESPECIALISTA',
          status: 'REQUESTED',
          durationMinutes: 60,
          startsAt: request.startsAt,
          endsAt: slot.endsAt,
          rejectionReason: null,
        }
        appointments.push(booked)
        body = booked
      }
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(body),
      }
    })
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('confirm', vi.fn(() => true))
    authStorage.save({ accessToken: 'patient-token', refreshToken: 'refresh-token', tokenType: 'Bearer', expiresIn: 900 }, false)

    renderWithAuth(<AppointmentsPage />, patient, '/patient')
    await screen.findByRole('heading', { name: 'Hola, Paciente!' })
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    await user.click(await screen.findByRole('button', { name: /Dra\. Elena Demo/ }))
    await user.selectOptions(screen.getAllByLabelText('Especialidad')[1], String(cardiology.id))
    await user.selectOptions(screen.getByLabelText('Sede'), '1')
    fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: day } })
    await user.click(await screen.findByRole('button', { name: /60 min/ }))
    await user.click(screen.getByRole('button', { name: 'Confirmar consulta' }))
    await screen.findByText('La consulta se agendó correctamente.')

    await user.click(screen.getByRole('button', { name: 'Citas' }))
    await screen.findByText('Pendiente de aprobación')
    expect(screen.getByText('Dra. Elena Demo · Clínica Demo')).toBeTruthy()
    expect(fetchMock.mock.calls.some(([input]) => new URL(String(input)).pathname === '/api/appointments/mine')).toBe(true)
  })
})
