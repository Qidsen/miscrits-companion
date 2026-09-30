import { elementIconUrl } from '../data/images'
import { splitElement } from '../domain/miscrit'
export function ElementIcons({ element, size = 18 }: { element: string; size?: number }) {
  return (
    <span className="element-icons" title={element}>
      {splitElement(element).map(e => <img key={e} src={elementIconUrl(e)} alt={e} width={size} height={size} onError={ev => { (ev.target as HTMLImageElement).style.display = 'none' }} />)}
    </span>
  )
}
