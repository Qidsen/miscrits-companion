const CDN = 'https://cdn.worldofmiscrits.com'
export const slug = (name: string) => encodeURIComponent(name.toLowerCase().replace(/\s+/g, '_'))
export const avatarUrl = (name: string) => `${CDN}/avatars/${slug(name)}_avatar.png`
export const spriteUrl = (name: string) => `${CDN}/miscrits/${slug(name)}_back.png`
export const elementIconUrl = (base: string) => `https://worldofmiscrits.com/${base.toLowerCase()}.png`
export const dataUrl = (file: string) => `${import.meta.env?.BASE_URL ?? './'}data/${file}`
export const mapImageUrl = (file: string) => dataUrl(`maps/${file}`)
