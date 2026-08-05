const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const srcSvg = path.join(__dirname, 'icon-source.svg')
const outDir = path.join(__dirname, '..', 'public', 'icons')
fs.mkdirSync(outDir, { recursive: true })

async function main() {
  await sharp(srcSvg).resize(192, 192).png().toFile(path.join(outDir, 'pwa-192.png'))
  await sharp(srcSvg).resize(512, 512).png().toFile(path.join(outDir, 'pwa-512.png'))
  await sharp(srcSvg).resize(180, 180).png().toFile(path.join(outDir, 'apple-touch-icon.png'))

  // Maskable icon needs safe-zone padding (~10%) since OSes crop to a circle/shape.
  const maskableSize = 512
  const padding = Math.round(maskableSize * 0.1)
  const innerSize = maskableSize - padding * 2
  const inner = await sharp(srcSvg).resize(innerSize, innerSize).toBuffer()
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: '#0B0C10',
    },
  })
    .composite([{ input: inner, left: padding, top: padding }])
    .png()
    .toFile(path.join(outDir, 'maskable-512.png'))

  console.log('Icons generated in', outDir)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
