const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')

export type User = {
  id: number
  name: string
  email: string
  role: 'ADMIN' | 'PROFESSIONAL' | 'PATIENT'
}

export type Specialty = { id: number; name: string; durationMinutes: number; category: 'GENERAL' | 'ESPECIALISTA' }
export type Site = { id: number; code: string; name: string; address: string }
export type Professional = {
  id: number
  name: string
  type: 'GENERAL' | 'ESPECIALISTA'
  description: string
  active: boolean
  specialties: Specialty[]
  sites: Site[]
}
export type AvailabilityBlock = {
  id: number
  professionalId: number
  siteId: number
  siteName: string
  startsAt: string
  endsAt: string
}
export type AvailableSlot = {
  professionalId: number
  professionalName: string
  specialtyId: number
  specialtyName: string
  siteId: number
  siteName: string
  startsAt: string
  endsAt: string
  durationMinutes: number
  appointmentType: string
}
export type Appointment = {
  id: number
  patientId: number
  professionalId: number
  professionalName: string
  specialtyId: number
  specialtyName: string
  siteId: number
  siteName: string
  type: 'GENERAL' | 'ESPECIALISTA'
  status: 'APPROVED' | 'REQUESTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
  durationMinutes: number
  startsAt: string
  endsAt: string
  rejectionReason: string | null
}

export type TokenResponse = {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
}

export class ApiError extends Error {
  readonly status: number

  constructor(
    message: string,
    status: number,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, { ...init, headers })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new ApiError(
        `Unable to connect to the API at ${API_URL}. Make sure it is running and reachable, and check for network or CORS errors.`,
        0,
      )
    }
    throw error
  }

  if (response.status === 204) return undefined as T

  const responseText = await response.text()
  let body: { message?: string }
  try {
    body = responseText ? JSON.parse(responseText) as { message?: string } : {}
  } catch {
    if (response.ok) {
      throw new ApiError('The API returned an invalid response body', response.status)
    }
    body = { message: `Request failed (${response.status})` }
  }
  if (!response.ok) {
    throw new ApiError(body.message || `Request failed (${response.status})`, response.status)
  }
  return body as T
}

export const authApi = {
  register(name: string, email: string, password: string) {
    return request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
  },

  login(email: string, password: string) {
    return request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  me(accessToken: string) {
    return request<User>('/auth/me', {}, accessToken)
  },

  refresh(refreshToken: string) {
    return request<TokenResponse>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },

  logout(refreshToken: string) {
    return request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
  },
}

export const appointmentApi = {
  specialties(accessToken: string) {
    return request<Specialty[]>('/api/catalog/specialties', {}, accessToken)
  },
  sites(accessToken: string) {
    return request<Site[]>('/api/catalog/sites', {}, accessToken)
  },
  professionals(accessToken: string, admin = false) {
    return request<Professional[]>(admin ? '/api/admin/professionals' : '/api/professionals', {}, accessToken)
  },
  saveProfessional(accessToken: string, userId: number, type: Professional['type'],
    description: string, licenseCode: string, specialtyIds: number[], siteIds: number[], existing = false) {
    const method = existing ? 'PUT' : 'POST'
    const path = existing ? `/api/admin/professionals/${userId}` : '/api/admin/professionals'
    return request<Professional>(path, {
      method,
      body: JSON.stringify({ userId, type, description, licenseCode, specialtyIds, siteIds }),
    }, accessToken)
  },
  deactivateProfessional(accessToken: string, userId: number) {
    return request<void>(`/api/admin/professionals/${userId}`, { method: 'DELETE' }, accessToken)
  },
  ownAvailability(accessToken: string, from: string, to: string) {
    return request<AvailabilityBlock[]>(
      `/api/professional/availability?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      {},
      accessToken,
    )
  },
  saveAvailability(accessToken: string, siteId: number, startsAt: string, endsAt: string, id?: number) {
    const method = id ? 'PUT' : 'POST'
    const path = id ? `/api/professional/availability/${id}` : '/api/professional/availability'
    return request<AvailabilityBlock>(path, {
      method,
      body: JSON.stringify({ siteId, startsAt, endsAt }),
    }, accessToken)
  },
  deleteAvailability(accessToken: string, id: number) {
    return request<void>(`/api/professional/availability/${id}`, { method: 'DELETE' }, accessToken)
  },
  availableSlots(accessToken: string, professionalId: number, specialtyId: number, siteId: number, from: string, to: string) {
    const query = new URLSearchParams({
      professionalId: String(professionalId),
      specialtyId: String(specialtyId),
      siteId: String(siteId),
      from,
      to,
    })
    return request<AvailableSlot[]>(`/api/availability?${query}`, {}, accessToken)
  },
  book(accessToken: string, professionalId: number, specialtyId: number, siteId: number, startsAt: string) {
    return request<Appointment>('/api/appointments', {
      method: 'POST',
      body: JSON.stringify({ professionalId, specialtyId, siteId, startsAt }),
    }, accessToken)
  },
  mine(accessToken: string) {
    return request<Appointment[]>('/api/appointments/mine', {}, accessToken)
  },
  adminAppointments(accessToken: string) {
    return request<Appointment[]>('/api/admin/appointments', {}, accessToken)
  },
  decide(accessToken: string, id: number, decision: 'APPROVE' | 'REJECT', reason?: string) {
    return request<Appointment>(`/api/admin/appointments/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, ...(reason ? { reason } : {}) }),
    }, accessToken)
  },
}

export const authStorage = {
  read(): TokenResponse | null {
    const serialized = localStorage.getItem('citas.auth')
      ?? sessionStorage.getItem('citas.auth')
    if (!serialized) return null
    try {
      return JSON.parse(serialized) as TokenResponse
    } catch (error) {
      localStorage.removeItem('citas.auth')
      sessionStorage.removeItem('citas.auth')
      console.warn('Invalid stored authentication data was cleared', error)
      return null
    }
  },

  save(tokens: TokenResponse, remember: boolean) {
    this.clear()
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('citas.auth', JSON.stringify(tokens))
  },

  clear() {
    localStorage.removeItem('citas.auth')
    sessionStorage.removeItem('citas.auth')
  },
}
