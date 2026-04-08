import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const svgData = readFileSync(join(root, 'public', 'favicon.svg'), 'utf-8')

// 배경을 추가한 SVG 래퍼 (아이콘 패딩 포함, 배경 #111)
function wrapSvg(size) {
  const padding = Math.round(size * 0.15)
  const inner = size - padding * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#111111"/>
  <svg x="${padding}" y="${padding}" width="${inner}" height="${inner}" viewBox="0 0 48 46">
    ${svgData.replace(/<svg[^>]*>/, '').replace('</svg>', '')}
  </svg>
</svg>`
}

mkdirSync(join(root, 'public'), { recursive: true })

for (const size of [192, 512]) {
  const svg = wrapSvg(size)
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  writeFileSync(join(root, 'public', `icon-${size}.png`), png)
  console.log(`✓ icon-${size}.png 생성 완료`)
}
