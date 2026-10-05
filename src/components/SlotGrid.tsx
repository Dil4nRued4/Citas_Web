import type { AvailableSlot } from '../services/api'

type SlotGridProps = {
  slots: AvailableSlot[]
  disabled?: boolean
  selectedStartsAt?: string
  onSelect: (slot: AvailableSlot) => void
}

export function SlotGrid({ slots, disabled = false, selectedStartsAt, onSelect }: SlotGridProps) {
  if (slots.length === 0) {
    return <p className="appointments-empty">No hay horarios libres para esta fecha. Selecciona otro día o profesional.</p>
  }
  return (
    <div className="slot-grid" aria-label="Horarios disponibles">
      {slots.map((slot) => (
        <button
          aria-pressed={selectedStartsAt === slot.startsAt}
          className={`slot-button${selectedStartsAt === slot.startsAt ? ' selected' : ''}`}
          key={slot.startsAt}
          disabled={disabled}
          onClick={() => onSelect(slot)}
        >
          {new Intl.DateTimeFormat('es-CO', { timeStyle: 'short' }).format(new Date(slot.startsAt))}
          <small>{slot.durationMinutes} min</small>
        </button>
      ))}
    </div>
  )
}
