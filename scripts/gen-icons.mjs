import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function makeSvg(size) {
  const r = Math.round(size * 0.5)         // 완전한 원형
  const fontSize = Math.round(size * 0.52)
  const emojiY = Math.round(size * 0.72)   // 이모지 세로 정렬 보정
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#2a2a2a"/>
  <text
    x="${size / 2}" y="${emojiY}"
    font-size="${fontSize}"
    text-anchor="middle"
    font-family="Segoe UI Emoji, Apple Color Emoji, Noto Color Emoji, sans-serif"
  >🍚</text>
</svg>`
}

for (const size of [192, 512]) {
  const svg = makeSvg(size)
  const resvg = new Resvg(svg, {
    font: { loadSystemFonts: true },
    fitTo: { mode: 'width', value: size },
  })
  const png = resvg.render().asPng()
  writeFileSync(join(root, 'public', `icon-${size}.png`), png)
  console.log(`✓ icon-${size}.png`)
}
