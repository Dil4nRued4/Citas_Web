import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState } from 'react'

type FormFieldProps = {
  id: string
  label: string
  placeholder: string
  type?: 'email' | 'password' | 'text'
  autoComplete?: string
  minLength?: number
  required?: boolean
  showPasswordLabel?: string
  hidePasswordLabel?: string
}

export function FormField({
  id,
  label,
  placeholder,
  type = 'text',
  autoComplete,
  minLength,
  required = true,
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
}: FormFieldProps) {
  const [visible, setVisible] = useState(false)
  const inputType = type === 'password' && visible ? 'text' : type
  const Icon = type === 'email' ? Mail : type === 'password' ? LockKeyhole : UserRound

  return (
    <div className={`form-field form-field--${type}`}>
      <label htmlFor={id}>{label}</label>
      <div className="input-line">
        <Icon aria-hidden="true" className="field-icon" size={17} strokeWidth={1.8} />
        <input
          autoComplete={autoComplete}
          id={id}
          minLength={minLength}
          name={id}
          placeholder={placeholder}
          required={required}
          type={inputType}
        />
        {type === 'password' && (
          <button
            aria-label={visible ? hidePasswordLabel : showPasswordLabel}
            className="password-toggle"
            onClick={() => setVisible((current) => !current)}
            type="button"
          >
            {visible
              ? <EyeOff aria-hidden="true" size={14} />
              : <Eye aria-hidden="true" size={14} />}
          </button>
        )}
      </div>
    </div>
  )
}
