/**
 * 식품안전나라 레시피 API (COOKRCP01)
 *
 * 엔드포인트: http://openapi.foodsafetykorea.go.kr/api/{KEY}/COOKRCP01/json/{start}/{end}
 * 환경변수:   VITE_COOKRCP_API_KEY
 *
 * 실제 응답 구조:
 *   {
 *     "COOKRCP01": {
 *       "total_count": "1136",
 *       "row": [
 *         {
 *           "RCP_SEQ":        "1",
 *           "RCP_NM":         "소고기미역국",
 *           "RCP_WAY2":       "끓이기",
 *           "RCP_PAT2":       "국&찌개",
 *           "INFO_WGT":       "200",       // 중량(g)
 *           "INFO_ENG":       "254",       // 에너지(kcal)
 *           "INFO_CAR":       "4.5",       // 탄수화물(g)
 *           "INFO_PRO":       "32",        // 단백질(g)
 *           "INFO_FAT":       "11.9",      // 지방(g)
 *           "INFO_NA":        "750",       // 나트륨(mg)
 *           "RCP_PARTS_DTLS": "소고기 100g, 미역 30g, ...",  // 재료 목록
 *           "MANUAL01":       "미역을 물에 불린다.",          // 조리 단계 1
 *           "MANUAL02":       "...",
 *           ...
 *           "MANUAL20":       "",
 *         }
 *       ],
 *       "RESULT": { "CODE": "INFO-000", "MESSAGE": "정상 처리되었습니다." }
 *     }
 *   }
 *
 * 개발 환경에서는 Vite 프록시(/api-proxy/cookrcp)를 통해 CORS·Mixed Content 우회
 */

const SERVICE = 'COOKRCP01'

// RCP_PAT2 (요리 분류) → 이모지
const PAT_EMOJI = {
  '밥':        '🍚',
  '죽·스프':   '🥣',
  '국&찌개':   '🥘',
  '볶음':      '🍳',
  '찜':        '🍲',
  '조림':      '🥣',
  '구이':      '🍖',
  '면·만두':   '🍜',
  '샐러드':    '🥗',
  '튀김':      '🍟',
  '나물·반찬': '🥬',
  '김치':      '🥬',
  '전·적':     '🥞',
  '후식':      '🍮',
}

function getApiKey() {
  const key = import.meta.env.VITE_COOKRCP_API_KEY
  if (!key) throw new Error('VITE_COOKRCP_API_KEY 환경변수가 설정되지 않았습니다')
  return key
}

async function fetchRaw(start, end) {
  const apiKey = getApiKey()

  const base = import.meta.env.DEV
    ? `/api-proxy/cookrcp/${apiKey}/${SERVICE}/json`
    : `http://openapi.foodsafetykorea.go.kr/api/${apiKey}/${SERVICE}/json`

  const res = await fetch(`${base}/${start}/${end}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  const body = json?.[SERVICE]
  if (!body) throw new Error('COOKRCP01 API 응답 형식 오류')

  const code = body.RESULT?.CODE
  if (code && code !== 'INFO-000') {
    throw new Error(`COOKRCP01 오류 [${code}]: ${body.RESULT?.MESSAGE}`)
  }

  return body.row ?? []
}

/**
 * "소고기 100g, 미역 30g, 국간장 2큰술" → [{name, amount}] 배열
 */
export function parseIngredients(partsText) {
  if (!partsText) return []
  return partsText
    .split(/[,·\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => {
      // "소고기 100g" → name: "소고기", amount: "100g"
      const match = s.match(/^(.+?)\s+([\d/.]+\s*[a-zA-Z가-힣]+.*)$/)
      if (match) return { name: match[1].trim(), amount: match[2].trim(), price: '' }
      return { name: s, amount: '', price: '' }
    })
}

/**
 * MANUAL01 ~ MANUAL20 텍스트를 단계 배열로 추출
 */
export function parseCookrcpSteps(row) {
  const steps = []
  for (let i = 1; i <= 20; i++) {
    const key = `MANUAL${String(i).padStart(2, '0')}`
    const val = row[key]?.trim()
    if (val) steps.push(val)
  }
  return steps
}

/**
 * 단계 수 → 난이도
 */
function stepsToDiff(stepCount) {
  if (stepCount <= 3) return '초간단'
  if (stepCount <= 6) return '보통'
  return '도전'
}

/**
 * COOKRCP01 row → 앱 내부 레시피 객체
 */
function normalizeRow(row) {
  const steps = parseCookrcpSteps(row)
  const diff  = stepsToDiff(steps.length)

  return {
    id:          Number(row.RCP_SEQ),
    name:        row.RCP_NM,
    emoji:       PAT_EMOJI[row.RCP_PAT2] ?? '🍽️',
    diff,
    mins:        diff === '초간단' ? '10분' : diff === '보통' ? '20분' : '40분',
    kcal:        Math.round(parseFloat(row.INFO_ENG) || 0),
    protein:     Math.round((parseFloat(row.INFO_PRO) || 0) * 10) / 10,
    carbs:       Math.round((parseFloat(row.INFO_CAR) || 0) * 10) / 10,
    fat:         Math.round((parseFloat(row.INFO_FAT) || 0) * 10) / 10,
    cost:        0,   // COOKRCP01은 가격 미제공 → mealPlan.js에서 추정
    servings:    '',
    sumry:       '',
    irdntCode:   '',
    ingredients: parseIngredients(row.RCP_PARTS_DTLS),
    steps,
  }
}

/**
 * 난이도에 맞는 레시피 목록 조회
 * @param {string} difficulty - '초간단' | '보통' | '도전'
 * @param {number} batchSize  - 필터링 전 가져올 레코드 수
 * @returns {Promise<Array>}  정규화된 레시피 배열
 */
export async function fetchCookrcpByDifficulty(difficulty, batchSize = 200) {
  const rows       = await fetchRaw(1, batchSize)
  const normalized = rows.map(normalizeRow)
  const filtered   = normalized.filter(r => r.diff === difficulty)
  return filtered.length >= 3 ? filtered : normalized
}
