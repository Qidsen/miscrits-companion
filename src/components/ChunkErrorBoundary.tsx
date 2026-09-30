import { Component, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { translate, type Lang } from '../i18n'

interface State { error: Error | null }

class Boundary extends Component<{ children: ReactNode; lang: Lang; resetKey: string }, State> {
  state: State = { error: null }
  static getDerivedStateFromError(error: Error): State { return { error } }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="container">
        <div className="card panel" role="alert" data-testid="chunk-error">
          <h2>{translate(this.props.lang, 'error.chunk')}</h2>
          <p className="muted">{translate(this.props.lang, 'error.chunkHint')}</p>
          <button className="btn btn-primary" onClick={() => location.reload()}>↻ {translate(this.props.lang, 'error.reload')}</button>
        </div>
      </div>
    )
  }
}

/** Keeps the shell alive when a page fails (e.g. a stale lazy chunk after a deploy) and offers a reload. */
export function ChunkErrorBoundary({ children, lang }: { children: ReactNode; lang: Lang }) {
  const { pathname } = useLocation()
  return <Boundary lang={lang} resetKey={pathname}>{children}</Boundary>
}
