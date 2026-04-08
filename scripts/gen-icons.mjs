import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// 밥그릇 SVG — 앱 컬러(#863bff) 기반 직접 드로잉
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <!-- 원형 배경 -->
  <rect width="100" height="100" rx="50" fill="#2a2a2a"/>

  <!-- 김밥/밥공기 그릇 테두리(흰색 호) -->
  <path d="M20 50 Q20 76 50 76 Q80 76 80 50 Z" fill="white"/>
  <!-- 그릇 받침 -->
  <rect x="36" y="74" width="28" height="5" rx="2.5" fill="white"/>
  <!-- 그릇 테두리 상단 바 -->
  <rect x="19" y="46" width="62" height="9" rx="4.5" fill="white"/>

  <!-- 밥(쌀알 — 보라색) -->
  <ellipse cx="38" cy="57" rx="3.2" ry="2.2" fill="#863bff"/>
  <ellipse cx="50" cy="54" rx="3.2" ry="2.2" fill="#863bff"/>
  <ellipse cx="62" cy="57" rx="3.2" ry="2.2" fill="#863bff"/>
  <ellipse cx="44" cy="64" rx="3.2" ry="2.2" fill="#863bff"/>
  <ellipse cx="56" cy="64" rx="3.2" ry="2.2" fill="#863bff"/>

  <!-- 김(검정 줄) -->
  <rect x="34" y="55.5" width="32" height="3" rx="1.5" fill="#1a1a1a" opacity="0.35"/>

  <!-- 수증기 -->
  <path d="M38 41 Q40.5 36.5 38 32" stroke="#863bff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M50 39 Q52.5 34.5 50 30" stroke="#863bff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
  <path d="M62 41 Q64.5 36.5 62 32" stroke="#863bff" stroke-width="2.2" stroke-linecap="round" fill="none"/>
</svg>`

for (const size of [192, 512]) {
  const resvg = new Resvg(ICON_SVG, { fitTo: { mode: 'width', value: size } })
  const png = resvg.render().asPng()
  writeFileSync(join(root, 'public', `icon-${size}.png`), png)
  console.log(`✓ icon-${size}.png (${size}x${size})`)
}
