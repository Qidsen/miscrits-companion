import type { CSSProperties, ReactNode } from 'react'

export function Panel({ title, actions, children, className = '', style, testId }:
  { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; style?: CSSProperties; testId?: string }) {
  return (
    <section className={`card panel ${className}`} style={style} data-testid={testId}>
      {(title || actions) && (
        <header className="panel-head">
          {title && <h2 className="section-title">{title}</h2>}
          {actions && <div className="row panel-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
