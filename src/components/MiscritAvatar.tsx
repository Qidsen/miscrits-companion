import { useState } from 'react'
import { avatarUrl } from '../data/images'

export function MiscritAvatar({ name, size = 56 }: { name: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  const style = { width: size, height: size }
  if (failed) {
    return <div className="avatar avatar-fallback" style={{ ...style, fontSize: size / 2.6 }} aria-label={name}>{name.slice(0, 2)}</div>
  }
  return <img className="avatar" style={style} src={avatarUrl(name)} alt={name} loading="lazy" onError={() => setFailed(true)} />
}
