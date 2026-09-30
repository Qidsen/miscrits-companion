export function ProgressRing({ value, total, size = 160, label }: { value: number; total: number; size?: number; label?: string }) {
  const r = size / 2 - 12
  const c = 2 * Math.PI * r
  const pct = total ? value / total : 0
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs><linearGradient id="ringGrad" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#ffd84a" /><stop offset="1" stopColor="#ff8a3d" /></linearGradient></defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dasharray .6s ease' }} />
      </svg>
      <div className="ring-text"><b>{Math.round(pct * 100)}%</b><span>{value} / {total}</span>{label && <span>{label}</span>}</div>
    </div>
  )
}
