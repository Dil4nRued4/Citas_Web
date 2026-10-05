import type { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
  panelMessage: string
  panelAction: string
}

export function AuthLayout({ children, panelMessage, panelAction }: AuthLayoutProps) {
  return (
    <main className="auth-shell">
      <aside className="welcome-panel">
        <div className="welcome-copy">
          <p>{panelMessage}</p>
          <p className="welcome-action">{panelAction}</p>
        </div>
      </aside>
      <section className="auth-panel">
        <div className="auth-form-wrap">{children}</div>
      </section>
    </main>
  )
}
