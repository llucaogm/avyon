const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..')
const wordmarkSrc = path.join(root, 'avyon-logo.png')
const markSrc = path.join(root, 'icon-avyon.png')
const assetsDir = path.join(root, 'src', 'assets')
const iconsDir = path.join(root, 'public', 'icons')

const BG = '#0B0C10'

async function main() {
  fs.mkdirSync(assetsDir, { recursive: true })
  fs.mkdirSync(iconsDir, { recursive: true })

  // Wordmark: trim padding, cap width for a reasonable file size, keep transparent bg.
  const wordmarkTrimmed = await sharp(wordmarkSrc).trim().toBuffer()
  await sharp(wordmarkTrimmed)
    .resize({ width: 900, withoutEnlargement: true })
    .png()
    .toFile(path.join(assetsDir, 'avyon-logo.png'))

  // Icon mark: trim, then composite (contain-fit) onto a square brand-dark canvas at each size.
  const markTrimmed = await sharp(markSrc).trim().toBuffer()

  async function squareIcon(size, contentScale, background) {
    const inner = Math.round(size * contentScale)
    const content = await sharp(markTrimmed)
      .resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toBuffer()
    return sharp({
      create: { width: size, height: size, channels: 4, background },
    })
      .composite([{ input: content }])
      .png()
  }

  await (await squareIcon(192, 0.62, BG)).toFile(path.join(iconsDir, 'pwa-192.png'))
  await (await squareIcon(512, 0.62, BG)).toFile(path.join(iconsDir, 'pwa-512.png'))
  await (await squareIcon(180, 0.62, BG)).toFile(path.join(iconsDir, 'apple-touch-icon.png'))
  // Maskable needs a bigger safe-zone margin since OSes crop to a circle/shape.
  await (await squareIcon(512, 0.45, BG)).toFile(path.join(iconsDir, 'maskable-512.png'))

  console.log('Logo assets processed.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
