import { useCallback, useEffect, useMemo, useState } from 'react'
import { LogOut, RefreshCw, Stethoscope } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { PatientHome, type PatientTab } from '../components/PatientHome'
import { SlotGrid } from '../components/SlotGrid'
import {
  ApiError,
  appointmentApi,
  authStorage,
  type Appointment,
  type AvailabilityBlock,
  type AvailableSlot,
  type Professional,
  type Site,
  type Specialty,
} from '../services/api'
import './appointments.css'

const CLINIC_TIME_ZONE = 'America/Bogota'

function token() {
  const value = authStorage.read()?.accessToken
  if (!value) throw new ApiError('La sesión expiró. Inicia sesión de nuevo.', 401)
  return value
}

function isoDay(day: string, hour = '00:00') {
  return new Date(`${day}T${hour}:00-05:00`).toISOString()
}

function initialDay() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: CLINIC_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

function dayAfter(days: number) {
  const [year, month, day] = initialDay().split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function formatted(instant: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: CLINIC_TIME_ZONE,
  }).format(new Date(instant))
}

function dateInputValue(instant: string) {
  const date = new Date(instant)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

function statusLabel(status: Appointment['status']) {
  return ({
    APPROVED: 'Aprobada',
    REQUESTED: 'Pendiente de aprobación',
    REJECTED: 'Rechazada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada',
    NO_SHOW: 'No asistió',
  })[status]
}

function AppointmentList({ appointments, emptyMessage = 'Aún no tienes citas. Explora los profesionales para agendar una consulta.' }:
  { appointments: Appointment[]; emptyMessage?: string }) {
  if (!appointments.length) {
    return <p className="appointments-empty">{emptyMessage}</p>
  }
  return (
    <div className="appointment-list">
      {appointments.map((appointment) => (
        <article className="appointment-card" key={appointment.id}>
          <div>
            <p className="appointment-date">{formatted(appointment.startsAt)}</p>
            <h3>{appointment.specialtyName}</h3>
            <p>{appointment.professionalName} · {appointment.siteName}</p>
          </div>
          <span className={`status-badge status-${appointment.status.toLowerCase()}`}>
            {statusLabel(appointment.status)}
          </span>
        </article>
      ))}
    </div>
  )
}

export function AppointmentsPage() {
  const { user, logout } = useAuth()
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [working, setWorking] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [patientTab, setPatientTab] = useState<PatientTab>('home')
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedSite, setSelectedSite] = useState('')
  const [selectedDay, setSelectedDay] = useState(initialDay)
  const [slots, setSlots] = useState<Awaited<ReturnType<typeof appointmentApi.availableSlots>>>([])
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [blockEditing, setBlockEditing] = useState<AvailabilityBlock | null>(null)
  const [blockSite, setBlockSite] = useState('')
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null)
  const [doctorUserId, setDoctorUserId] = useState('')
  const [doctorType, setDoctorType] = useState<Professional['type']>('GENERAL')
  const [doctorDescription, setDoctorDescription] = useState('')
  const [doctorLicense, setDoctorLicense] = useState('')
  const [doctorSpecialties, setDoctorSpecialties] = useState<number[]>([])
  const [doctorSites, setDoctorSites] = useState<number[]>([])

  const isAdmin = user?.role === 'ADMIN'
  const isProfessional = user?.role === 'PROFESSIONAL'
  const isPatient = user?.role === 'PATIENT'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const accessToken = token()
      const [allSpecialties, allSites, people, list] = await Promise.all([
        appointmentApi.specialties(accessToken),
        appointmentApi.sites(accessToken),
        isAdmin || isProfessional ? Promise.resolve([]) : appointmentApi.professionals(accessToken),
        isAdmin ? appointmentApi.adminAppointments(accessToken)
          : isProfessional ? Promise.resolve([]) : appointmentApi.mine(accessToken),
      ])
      setSpecialties(allSpecialties)
      setSites(allSites)
      setProfessionals(people)
      setAppointments(list)
      if (isProfessional) {
        setBlocks(await appointmentApi.ownAvailability(accessToken, isoDay(initialDay()), isoDay(dayAfter(31))))
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible cargar la información.')
    } finally {
      setLoading(false)
    }
  }, [isAdmin, isProfessional])

  useEffect(() => { void load() }, [load])

  const visibleProfessionals = useMemo(() => professionals.filter((professional) =>
    (!filterType || professional.type === filterType)
    && (!filterSpecialty || professional.specialties.some((specialty) => String(specialty.id) === filterSpecialty))
    && (!patientSearch.trim() || [
      professional.name,
      professional.description,
      professional.specialties.map((specialty) => specialty.name).join(' '),
    ].join(' ').toLocaleLowerCase('es-CO').includes(patientSearch.trim().toLocaleLowerCase('es-CO')))),
  [professionals, filterType, filterSpecialty, patientSearch])

  function browseSpecialty(specialtyId: number) {
    setFilterSpecialty(String(specialtyId))
    setSelectedProfessional(null)
    setPatientTab('search')
  }

  function browseProfessional(professional: Professional) {
    setSelectedProfessional(professional)
    setSelectedSpecialty(professional.specialties.length === 1 ? String(professional.specialties[0].id) : '')
    setSelectedSite(professional.sites.length === 1 ? String(professional.sites[0].id) : '')
    setPatientTab('search')
  }

  const loadSlots = useCallback(async () => {
    if (!selectedProfessional || !selectedSpecialty || !selectedSite || isAdmin || isProfessional) {
      setSlots([])
      setLoadingSlots(false)
      return
    }
    setError('')
    setSlots([])
    setSelectedSlot(null)
    setLoadingSlots(true)
    try {
      setSlots(await appointmentApi.availableSlots(token(), selectedProfessional.id, Number(selectedSpecialty),
        Number(selectedSite), isoDay(selectedDay), isoDay(selectedDay, '23:59')))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible consultar los horarios.')
    } finally {
      setLoadingSlots(false)
    }
  }, [selectedProfessional, selectedSpecialty, selectedSite, selectedDay, isAdmin, isProfessional])

  useEffect(() => { void loadSlots() }, [loadSlots])

  async function book(startsAt: string) {
    if (!selectedProfessional || !selectedSpecialty || !selectedSite) return
    const specialty = specialties.find((item) => item.id === Number(selectedSpecialty))
    if (!window.confirm(`¿Confirmas la consulta de ${specialty?.durationMinutes ?? ''} minutos el ${formatted(startsAt)}?`)) return
    setWorking(true)
    setError('')
    try {
      await appointmentApi.book(token(), selectedProfessional.id, Number(selectedSpecialty), Number(selectedSite), startsAt)
      setSuccess('La consulta se agendó correctamente.')
      setSelectedSlot(null)
      await load()
      await loadSlots()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible agendar la consulta.')
    } finally {
      setWorking(false)
    }
  }

  async function decide(appointment: Appointment, decision: 'APPROVE' | 'REJECT') {
    const reason = decision === 'REJECT' ? window.prompt('Escribe el motivo del rechazo:') : undefined
    if (decision === 'REJECT' && !reason?.trim()) return
    const action = decision === 'APPROVE' ? 'aprobar' : 'rechazar'
    if (!window.confirm(`¿Confirmas ${action} esta solicitud?`)) return
    setWorking(true)
    setError('')
    try {
      await appointmentApi.decide(token(), appointment.id, decision, reason?.trim())
      setSuccess(`La solicitud fue ${decision === 'APPROVE' ? 'aprobada' : 'rechazada'}.`)
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible actualizar la cita.')
    } finally {
      setWorking(false)
    }
  }

  function editBlock(block: AvailabilityBlock) {
    setBlockEditing(block)
    setBlockSite(String(block.siteId))
    setBlockStart(dateInputValue(block.startsAt))
    setBlockEnd(dateInputValue(block.endsAt))
  }

  async function saveBlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWorking(true)
    setError('')
    try {
      await appointmentApi.saveAvailability(token(), Number(blockSite), new Date(blockStart).toISOString(),
        new Date(blockEnd).toISOString(), blockEditing?.id)
      setSuccess(blockEditing ? 'La disponibilidad se actualizó.' : 'La disponibilidad se creó.')
      setBlockEditing(null)
      setBlockStart('')
      setBlockEnd('')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar la disponibilidad.')
    } finally {
      setWorking(false)
    }
  }

  async function deleteBlock(block: AvailabilityBlock) {
    if (!window.confirm(`¿Eliminar el bloque del ${formatted(block.startsAt)}?`)) return
    try {
      await appointmentApi.deleteAvailability(token(), block.id)
      setSuccess('El bloque de disponibilidad se eliminó.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible eliminar el bloque.')
    }
  }

  function resetProfessionalForm() {
    setEditingProfessional(null)
    setDoctorUserId('')
    setDoctorType('GENERAL')
    setDoctorDescription('')
    setDoctorLicense('')
    setDoctorSpecialties([])
    setDoctorSites([])
  }

  function editProfessional(professional: Professional) {
    setEditingProfessional(professional)
    setDoctorUserId(String(professional.id))
    setDoctorType(professional.type)
    setDoctorDescription(professional.description)
    setDoctorLicense('')
    setDoctorSpecialties(professional.specialties.map((item) => item.id))
    setDoctorSites(professional.sites.map((item) => item.id))
  }

  async function saveProfessional(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setWorking(true)
    setError('')
    try {
      await appointmentApi.saveProfessional(token(), Number(doctorUserId), doctorType, doctorDescription, doctorLicense,
        doctorSpecialties, doctorSites, Boolean(editingProfessional))
      setSuccess(editingProfessional ? 'Los datos del profesional se actualizaron.' : 'El profesional se creó.')
      resetProfessionalForm()
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar el profesional.')
    } finally {
      setWorking(false)
    }
  }

  async function deactivateProfessional(professional: Professional) {
    if (!window.confirm(`¿Desactivar a ${professional.name}?`)) return
    try {
      await appointmentApi.deactivateProfessional(token(), professional.id)
      setSuccess('El profesional se desactivó.')
      await load()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible desactivar el profesional.')
    }
  }

  async function handleLogout() {
    try {
      await logout()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible cerrar la sesión.')
    }
  }

  return (
    <main className="clinic-shell">
      <header className="clinic-header">
        <a className="clinic-brand" href="/"><Stethoscope size={23} /> Citas médicas</a>
        <div className="clinic-user">
          <span>{user?.name} <small>{user?.role === 'PATIENT' ? 'Paciente' : user?.role}</small></span>
          <button className="quiet-button" onClick={() => void handleLogout()}><LogOut size={17} /> Cerrar sesión</button>
        </div>
      </header>
      <div className={`clinic-content ${isPatient ? 'patient-content' : ''}`}>
        {!(isPatient && patientTab === 'home') && <section className="clinic-heading">
          <div><p className="clinic-kicker">Atención en salud</p><h1>{isAdmin ? 'Administrar citas' : isProfessional ? 'Mi disponibilidad'
            : patientTab === 'appointments' ? 'Mis citas' : patientTab === 'profile' ? 'Mi perfil' : 'Buscar doctores'}</h1>
            <p>{isAdmin ? 'Gestiona profesionales y solicitudes especializadas.' : isProfessional ? 'Organiza tus bloques de atención.'
              : patientTab === 'appointments' ? 'Consulta tus próximas consultas y su estado.'
                : patientTab === 'profile' ? 'Consulta la información de tu cuenta.' : 'Elige tu doctor, consulta los horarios y agenda.'}</p></div>
          <button className="quiet-button" onClick={() => void load()} aria-label="Actualizar información"><RefreshCw size={17} /> Actualizar</button>
        </section>}

        {error && <div className="clinic-alert clinic-alert-error" role="alert"><span>{error}</span>
          <button onClick={() => { void load(); void loadSlots() }}>Reintentar</button></div>}
        {success && <div className="clinic-alert clinic-alert-success" role="status">{success}<button onClick={() => setSuccess('')} aria-label="Cerrar aviso">×</button></div>}
        {loading ? <div className="clinic-loading" role="status">Cargando información médica…</div> : (
          <>
            {isAdmin && (
              <>
                <section className="clinic-section">
                  <div className="section-heading"><div><h2>Solicitudes especializadas</h2><p>Revisa y decide las citas que esperan aprobación.</p></div></div>
                  {appointments.filter((item) => item.status === 'REQUESTED').length === 0
                    ? <p className="appointments-empty">No hay solicitudes pendientes.</p>
                    : appointments.filter((item) => item.status === 'REQUESTED').map((item) => (
                      <article className="admin-request" key={item.id}>
                        <div><span className="status-badge status-requested">Pendiente</span><h3>{item.specialtyName}</h3>
                          <p>{item.professionalName} · {formatted(item.startsAt)} · {item.siteName}</p></div>
                        <div className="action-row"><button disabled={working} className="small-primary" onClick={() => void decide(item, 'APPROVE')}>Aprobar</button>
                          <button disabled={working} className="small-danger" onClick={() => void decide(item, 'REJECT')}>Rechazar</button></div>
                      </article>
                    ))}
                </section>
                <section className="clinic-section">
                  <div className="section-heading"><div><h2>Profesionales</h2><p>Administra doctores y asignaciones.</p></div></div>
                  <form className="doctor-form" onSubmit={(event) => void saveProfessional(event)}>
                    <h3>{editingProfessional ? `Editar ${editingProfessional.name}` : 'Agregar profesional'}</h3>
                    <div className="form-grid">
                      <label>ID de usuario existente<input required type="number" min="1" value={doctorUserId} disabled={Boolean(editingProfessional)} onChange={(event) => setDoctorUserId(event.target.value)} /></label>
                      <label>Tipo<select value={doctorType} onChange={(event) => { setDoctorType(event.target.value as Professional['type']); setDoctorSpecialties([]) }}>
                        <option value="GENERAL">Médico general</option><option value="ESPECIALISTA">Especialista</option></select></label>
                      <label>Descripción<input required maxLength={500} value={doctorDescription} onChange={(event) => setDoctorDescription(event.target.value)} /></label>
                      <label>Código profesional{editingProfessional ? ' (opcional si no cambia)' : ''}
                        <input required={!editingProfessional} maxLength={80} value={doctorLicense} onChange={(event) => setDoctorLicense(event.target.value)} /></label>
                    </div>
                    {!editingProfessional && <p className="form-hint">El usuario debe existir previamente. La API actual no ofrece administración de cuentas desde esta pantalla.</p>}
                    <fieldset><legend>Especialidades asignadas</legend>{specialties.filter((item) => item.category === doctorType).map((item) => (
                      <label className="choice-label" key={item.id}><input type="checkbox" checked={doctorSpecialties.includes(item.id)}
                        onChange={(event) => setDoctorSpecialties(event.target.checked ? [...doctorSpecialties, item.id] : doctorSpecialties.filter((id) => id !== item.id))} />
                        {item.name} ({item.durationMinutes} min)</label>
                    ))}</fieldset>
                    <fieldset><legend>Sedes asignadas</legend>{sites.map((item) => (
                      <label className="choice-label" key={item.id}><input type="checkbox" checked={doctorSites.includes(item.id)}
                        onChange={(event) => setDoctorSites(event.target.checked ? [...doctorSites, item.id] : doctorSites.filter((id) => id !== item.id))} />
                        {item.name}</label>
                    ))}</fieldset>
                    <div className="action-row"><button className="small-primary" disabled={working}>{editingProfessional ? 'Guardar cambios' : 'Crear profesional'}</button>
                      {editingProfessional && <button type="button" className="quiet-button" onClick={resetProfessionalForm}>Cancelar edición</button>}</div>
                  </form>
                  {professionals.length === 0 ? <p className="appointments-empty">No hay profesionales registrados. Usa el formulario para agregar uno.</p> : (
                    <div className="professional-grid">{professionals.map((professional) => (
                      <article className="professional-card" key={professional.id}><div><h3>{professional.name}</h3><p>{professional.type === 'GENERAL' ? 'Medicina general' : 'Especialista'}</p>
                        <p>{professional.specialties.map((item) => item.name).join(', ')}</p><p>{professional.description}</p></div>
                        <div className="action-row"><button className="quiet-button" onClick={() => editProfessional(professional)}>Editar</button>
                          <button className="small-danger" onClick={() => void deactivateProfessional(professional)}>Desactivar</button></div></article>
                    ))}</div>
                  )}
                </section>
                <section className="clinic-section"><div className="section-heading"><div><h2>Todas las citas</h2><p>Listado de citas con su estado actual.</p></div></div>
                  <AppointmentList appointments={appointments} emptyMessage="No hay citas registradas." /></section>
              </>
            )}

            {isProfessional && (
              <section className="clinic-section">
                <div className="section-heading"><div><h2>Bloques de disponibilidad</h2><p>Define horarios futuros en tus sedes asignadas.</p></div></div>
                <form className="doctor-form availability-form" onSubmit={(event) => void saveBlock(event)}>
                  <h3>{blockEditing ? 'Editar bloque' : 'Crear bloque'}</h3>
                  <div className="form-grid">
                    <label>Sede<select required value={blockSite} onChange={(event) => setBlockSite(event.target.value)}><option value="">Selecciona una sede</option>
                      {sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}</select></label>
                    <label>Inicio<input required type="datetime-local" value={blockStart} onChange={(event) => setBlockStart(event.target.value)} /></label>
                    <label>Fin<input required type="datetime-local" value={blockEnd} onChange={(event) => setBlockEnd(event.target.value)} /></label>
                  </div>
                  <p className="form-hint">Los bloques deben comenzar y finalizar en la grilla de 30 minutos y no pueden solaparse.</p>
                  <div className="action-row"><button className="small-primary" disabled={working}>{blockEditing ? 'Guardar cambios' : 'Crear disponibilidad'}</button>
                    {blockEditing && <button type="button" className="quiet-button" onClick={() => setBlockEditing(null)}>Cancelar edición</button>}</div>
                </form>
                {blocks.length === 0 ? <p className="appointments-empty">No tienes disponibilidad registrada.</p> : blocks.map((block) => (
                  <article className="admin-request" key={block.id}><div><h3>{block.siteName}</h3><p>{formatted(block.startsAt)} — {formatted(block.endsAt)}</p></div>
                    <div className="action-row"><button className="quiet-button" onClick={() => editBlock(block)}>Editar</button>
                      <button className="small-danger" onClick={() => void deleteBlock(block)}>Eliminar</button></div></article>
                ))}
              </section>
            )}

            {isPatient && user && (
              <PatientHome
                user={user}
                specialties={specialties}
                professionals={visibleProfessionals}
                appointments={appointments}
                query={patientSearch}
                activeTab={patientTab}
                onQueryChange={setPatientSearch}
                onTabChange={setPatientTab}
                onSelectSpecialty={browseSpecialty}
                onSelectProfessional={browseProfessional}
              />
            )}

            {!isAdmin && !isProfessional && (
              <>
                {patientTab === 'search' && <section className="clinic-section">
                  <div className="filter-row">
                    <label>Tipo de profesional<select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
                      <option value="">Todos</option><option value="GENERAL">Médico general</option><option value="ESPECIALISTA">Especialista</option></select></label>
                    <label>Especialidad<select value={filterSpecialty} onChange={(event) => setFilterSpecialty(event.target.value)}>
                      <option value="">Todas</option>{specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                  </div>
                  {visibleProfessionals.length === 0 ? <p className="appointments-empty">No hay profesionales para estos filtros. Prueba otra búsqueda.</p> : (
                    <div className="professional-grid">{visibleProfessionals.map((professional) => (
                      <button className={`professional-card selectable ${selectedProfessional?.id === professional.id ? 'selected' : ''}`}
                        key={professional.id} onClick={() => { setSelectedProfessional(professional); setSelectedSpecialty(''); setSelectedSite('') }}>
                        <span className="professional-type">{professional.type === 'GENERAL' ? 'Médico general' : 'Especialista'}</span>
                        <h3>{professional.name}</h3><p>{professional.specialties.map((item) => item.name).join(', ')}</p><p>{professional.description}</p>
                      </button>
                    ))}</div>
                  )}
                </section>}
                {patientTab === 'search' && selectedProfessional && (
                  <section className="clinic-section booking-panel">
                    <div className="section-heading"><div><h2>Elige especialidad y horario</h2><p>Profesional: {selectedProfessional.name}</p></div></div>
                    <div className="filter-row">
                      <label>Especialidad<select required value={selectedSpecialty} onChange={(event) => setSelectedSpecialty(event.target.value)}>
                        <option value="">Elige especialidad</option>{selectedProfessional.specialties.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.durationMinutes} min</option>)}</select></label>
                      <label>Sede<select required value={selectedSite} onChange={(event) => setSelectedSite(event.target.value)}>
                        <option value="">Selecciona una sede</option>{selectedProfessional.sites.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                      <label>Fecha<input type="date" min={initialDay()} value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} /></label>
                    </div>
                    {selectedSpecialty && selectedSite && (
                      loadingSlots
                        ? <p className="clinic-loading" role="status">Consultando horarios disponibles…</p>
                        : <SlotGrid slots={slots} disabled={working} selectedStartsAt={selectedSlot?.startsAt}
                          onSelect={setSelectedSlot} />
                    )}
                    {selectedSlot && <div className="selected-slot" role="status">
                      <span>Horario seleccionado: {formatted(selectedSlot.startsAt)} · {selectedSlot.durationMinutes} min</span>
                      <button className="primary-button confirm-booking" disabled={working}
                        onClick={() => void book(selectedSlot.startsAt)}>{working ? 'Agendando…' : 'Confirmar consulta'}</button>
                    </div>}
                  </section>
                )}
                {patientTab === 'appointments' && (
                  <section className="clinic-section"><div className="section-heading"><div><h2>Mis citas</h2><p>Consulta el estado de tus citas médicas.</p></div></div>
                    <AppointmentList appointments={appointments} /></section>
                )}
                {patientTab === 'profile' && (
                  <section className="clinic-section patient-profile-card">
                    <span className="patient-avatar" aria-hidden="true">{user?.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')}</span>
                    <h2>{user?.name}</h2>
                    <p>{user?.email}</p>
                    <span>Paciente</span>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  )
}
