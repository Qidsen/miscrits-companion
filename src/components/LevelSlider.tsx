import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { FORMULA } from '../domain/formulaConfig'

/** Level range input that only commits (e.g. to the URL) when the drag ends, not on every tick. */
export function LevelSlider({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const t = useT()
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  const commit = () => { if (local !== value) onCommit(local) }
  return (
    <label className="small">{t('pick.level', { n: local })}
      <input className="range" type="range" min={1} max={FORMULA.maxLevel} value={local}
        onChange={e => setLocal(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} onTouchEnd={commit} />
    </label>
  )
}
