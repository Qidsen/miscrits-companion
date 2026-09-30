import { useState } from 'react'
import { spriteUrl } from '../data/images'
import { MiscritAvatar } from './MiscritAvatar'

/** Full-body sprite; falls back to the round avatar (and then initials) when the CDN has no image. */
export function Sprite({ name, size = 120, className = '' }: { name: string; size?: number; className?: string }) {
  const url = spriteUrl(name)
  const [failed, setFailed] = useState<string | null>(null)
  if (failed === url) return <MiscritAvatar name={name} size={Math.round(size * 0.7)} />
  return (
    <img className={`sprite ${className}`} src={url} alt={name} loading="lazy" draggable={false}
      style={{ width: size, height: size, objectFit: 'contain' }} onError={() => setFailed(url)} />
  )
}
