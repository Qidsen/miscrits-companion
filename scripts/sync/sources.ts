export const GAME_JSON = 'https://worldofmiscrits.com/miscrits.json'
export const COMPANION_API = 'https://api.miscritcompanion.com/api'
export const ORGANIZED = `${COMPANION_API}/miscrits/organized`
export const AREA_NAMES = `${COMPANION_API}/area-friendly-names`
export const RELICS = `${COMPANION_API}/relics`
export const markersUrl = (region: string) => `${COMPANION_API}/markers/load/${encodeURIComponent(region)}`
export const mapUrl = (file: string) => `${COMPANION_API}/maps/${file}`

/** region → source map file on miscritcompanion */
export const MAP_FILES: Record<string, string> = {
  Cave: 'cave.png', 'Emerald Isle': 'emerald_isle.webp', Forest: 'forest.jpg', 'Hidden Forest': 'hidden_forest.jpg',
  Mansion: 'mansion_all.png', 'Miscrian Jungle': 'jungle.webp', Moon: 'moon.png', 'Mount Gemma': 'mount_gemma.png',
  Shack: 'shack_all.jpg', 'Sunfall Shores': 'sunfall_shores.jpg', Temple: 'temple.webp', 'Monks Mountain': 'monks_mountain.webp',
}
