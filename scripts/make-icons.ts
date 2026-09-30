import sharp from 'sharp'

const svg = 'public/icon.svg'
await sharp(svg).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icon-512.png')
// maskable: extra safe-zone padding on the brand background
await sharp(svg).resize(400, 400).extend({ top: 56, bottom: 56, left: 56, right: 56, background: '#0b0e15' }).png().toFile('public/icon-maskable-512.png')
await sharp(svg).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log('icons ok')
