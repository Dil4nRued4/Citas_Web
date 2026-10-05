import {
  Activity,
  Baby,
  Brain,
  CalendarDays,
  CalendarPlus,
  HeartPulse,
  House,
  Search,
  SlidersHorizontal,
  Star,
  Stethoscope,
  UserRound,
} from 'lucide-react'
import type { Appointment, Professional, Specialty, User } from '../services/api'

export type PatientTab = 'home' | 'appointments' | 'search' | 'profile'

type PatientHomeProps = {
  user: User
  specialties: Specialty[]
  professionals: Professional[]
  appointments: Appointment[]
  query: string
  activeTab: PatientTab
  onQueryChange: (value: string) => void
  onTabChange: (tab: PatientTab) => void
  onSelectSpecialty: (id: number) => void
  onSelectProfessional: (professional: Professional) => void
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function specialtyIcon(name: string) {
  const normalized = name.toLocaleLowerCase('es-CO')
  if (normalized.includes('cardio')) return HeartPulse
  if (normalized.includes('neuro')) return Brain
  if (normalized.includes('pediatr')) return Baby
  if (normalized.includes('ortop') || normalized.includes('traumat')) return Activity
  return Stethoscope
}

function dateLabel(instant: string) {
  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/Bogota',
  }).format(new Date(instant))
}

function nextAppointment(appointments: Appointment[]) {
  const now = Date.now()
  return appointments
    .filter((item) => ['APPROVED', 'REQUESTED'].includes(item.status) && new Date(item.startsAt).getTime() > now)
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt))[0]
}

export function PatientHome({
  user,
  specialties,
  professionals,
  appointments,
  query,
  activeTab,
  onQueryChange,
  onTabChange,
  onSelectSpecialty,
  onSelectProfessional,
}: PatientHomeProps) {
  const firstName = user.name.trim().split(/\s+/)[0] || 'paciente'
  const upcoming = nextAppointment(appointments)
  const matchingSpecialties = specialties.filter((specialty) =>
    specialty.name.toLocaleLowerCase('es-CO').includes(query.trim().toLocaleLowerCase('es-CO')))
  const featuredDoctors = professionals.slice(0, 3)

  return (
    <>
      {activeTab === 'home' && (
        <div className="patient-home">
          <div className="patient-greeting">
            <span className="patient-avatar" aria-hidden="true">{initials(user.name)}</span>
            <div>
              <p className="patient-eyebrow">Tu salud, a un paso</p>
              <h1>Hola, {firstName}!</h1>
            </div>
          </div>

          <form className="patient-search-row" onSubmit={(event) => { event.preventDefault(); onTabChange('search') }}>
            <label className="patient-search">
              <Search size={19} aria-hidden="true" />
              <span className="sr-only">Buscar doctores o especialidades</span>
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Buscar"
                type="search"
              />
            </label>
            <button
              aria-label="Abrir filtros de búsqueda"
              className="patient-filter-button"
              onClick={() => onTabChange('search')}
              type="button"
            >
              <SlidersHorizontal size={20} />
            </button>
          </form>

          <section className="patient-section" aria-labelledby="patient-specialties-heading">
            <div className="patient-section-heading">
              <h2 id="patient-specialties-heading">Especialidades</h2>
              <button className="patient-see-all" onClick={() => onTabChange('search')} type="button">Ver todo</button>
            </div>
            {matchingSpecialties.length === 0 ? (
              <p className="appointments-empty">No hay especialidades que coincidan con tu búsqueda.</p>
            ) : (
              <div className="specialty-carousel" aria-label="Especialidades disponibles">
                {matchingSpecialties.map((specialty) => {
                  const Icon = specialtyIcon(specialty.name)
                  return (
                    <button
                      className="specialty-tile"
                      key={specialty.id}
                      onClick={() => onSelectSpecialty(specialty.id)}
                      type="button"
                    >
                      <Icon size={27} strokeWidth={1.8} aria-hidden="true" />
                      <span>{specialty.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          <section className="patient-section patient-doctors-section" aria-labelledby="patient-doctors-heading">
            <div className="patient-section-heading">
              <h2 id="patient-doctors-heading">Profesionales disponibles</h2>
              <button className="patient-see-all" onClick={() => onTabChange('search')} type="button">Ver todo</button>
            </div>
            {featuredDoctors.length === 0 ? (
              <div className="appointments-empty">
                <p>No encontramos profesionales disponibles.</p>
                <button className="quiet-button" onClick={() => onTabChange('search')} type="button">Buscar de nuevo</button>
              </div>
            ) : (
              <div className="patient-doctor-list">
                {featuredDoctors.map((professional) => (
                  <article className="patient-doctor-card" key={professional.id}>
                    <span className="patient-doctor-avatar" aria-hidden="true">{initials(professional.name)}</span>
                    <div className="patient-doctor-info">
                      <h3>{professional.name}</h3>
                      <p className="patient-doctor-specialty">
                        {professional.specialties.map((specialty) => specialty.name).join(', ')
                          || (professional.type === 'GENERAL' ? 'Medicina general' : 'Especialista')}
                      </p>
                      <p className="patient-doctor-description">{professional.description}</p>
                      <div className="patient-doctor-meta">
                        <span><Star size={14} fill="currentColor" aria-hidden="true" /> Sin calificación</span>
                        <span>Horarios por consultar</span>
                      </div>
                    </div>
                    <button
                      aria-label={`Agendar con ${professional.name}`}
                      className="patient-book-button"
                      onClick={() => onSelectProfessional(professional)}
                      type="button"
                    >
                      <CalendarPlus size={18} />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>

          {activeTab === 'home' && upcoming && (
            <aside className="patient-next-appointment" aria-label="Próxima cita">
              <span className="patient-next-avatar" aria-hidden="true">{initials(upcoming.professionalName)}</span>
              <div>
                <span className="patient-next-label">Tu próxima consulta</span>
                <strong>{upcoming.professionalName}</strong>
                <span>{dateLabel(upcoming.startsAt)} · {upcoming.specialtyName}</span>
              </div>
              <span className={`status-badge status-${upcoming.status.toLowerCase()}`}>
                {upcoming.status === 'REQUESTED' ? 'Solicitada' : 'Aprobada'}
              </span>
            </aside>
          )}
        </div>
      )}

      <nav className="patient-bottom-nav" aria-label="Navegación principal">
        <button aria-current={activeTab === 'home' ? 'page' : undefined} onClick={() => onTabChange('home')} type="button">
          <House size={21} /><span>Inicio</span>
        </button>
        <button aria-current={activeTab === 'appointments' ? 'page' : undefined} onClick={() => onTabChange('appointments')} type="button">
          <CalendarDays size={21} /><span>Citas</span>
        </button>
        <button aria-current={activeTab === 'search' ? 'page' : undefined} onClick={() => onTabChange('search')} type="button">
          <Search size={21} /><span>Buscar</span>
        </button>
        <button aria-current={activeTab === 'profile' ? 'page' : undefined} onClick={() => onTabChange('profile')} type="button">
          <UserRound size={21} /><span>Perfil</span>
        </button>
      </nav>
    </>
  )
}
