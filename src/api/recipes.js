/**
 * 농림수산식품교육문화정보원 레시피 기본정보 API
 *
 * 엔드포인트: http://211.237.50.150:7080/openapi/{KEY}/json/Grid_20150827000000000226_1/{start}/{end}
 * 환경변수:   VITE_RECIPE_API_KEY
 *
 * 실제 응답 구조 (curl 확인 기준):
 *   {
 *     "Grid_20150827000000000226_1": {
 *       "totalCnt": 537,
 *       "startRow": 1,
 *       "endRow": 3,
 *       "result": { "code": "INFO-000", "message": "정상 처리되었습니다." },
 *       "row": [
 *         {
 *           "ROW_NUM":     1,
 *           "RECIPE_ID":   1,
 *           "RECIPE_NM_KO": "나물비빔밥",
 *           "SUMRY":       "요약 설명",
 *           "NATION_NM":   "한식",
 *           "TY_NM":       "밥",           // 요리 유형
 *           "COOKING_TIME": "60분",        // 숫자+분 형식
 *           "CALORIE":     "580Kcal",      // 숫자+Kcal 형식
 *           "QNT":         "4인분",
 *           "LEVEL_NM":    "보통",          // 난이도 직접 제공
 *           "IRDNT_CODE":  "곡류",          // 재료 분류
 *           "PC_NM":       "5,000원"        // 예상 식재료 비용
 *         }
 *       ]
 *     }
 *   }
 *
 * 개발 환경에서는 Vite 프록시(/api-proxy/recipe)를 통해 CORS·Mixed Content 우회
 */

const SERVICE_NAME = 'Grid_20150827000000000226_1'

// TY_NM (요리 유형) → 이모지
const TYPE_EMOJI = {
  '밥':       '🍚',
  '죽':       '🥣',
  '국&찌개':  '🥘',
  '볶음':     '🍳',
  '찜':       '🍲',
  '조림':     '🥣',
  '구이':     '🍖',
  '면&만두':  '🍜',
  '샐러드':   '🥗',
  '튀김':     '🍟',
  '나물&무침':'🥬',
  '김치':     '🥬',
  '전&적':    '🥞',
  '후식':     '🍮',
  '음청류':   '🍵',
}

// LEVEL_NM → 앱 난이도
const LEVEL_DIFF = {
  '쉬움':    '초간단',
  '초급':    '초간단',
  '보통':    '보통',
  '중급':    '보통',
  '어려움':  '도전',
  '고급':    '도전',
}

/**
 * COOKING_TIME("60분", "30분", "15분" 등) → 분 단위 숫자
 */
function parseCookingMins(cookingTime) {
  return parseInt(cookingTime, 10) || 30
}

/**
 * 분 단위 → 앱 난이도 (LEVEL_NM 없을 때 보조 수단)
 */
function minsToDiff(mins) {
  if (mins <= 15) return '초간단'
  if (mins <= 30) return '보통'
  return '도전'
}

/**
 * "5,000원" 형식 → 숫자 (파싱 실패 시 0)
 */
function parsePcNm(pcNm) {
  if (!pcNm) return 0
  return parseInt(pcNm.replace(/[^0-9]/g, ''), 10) || 0
}

/**
 * "580Kcal" 형식 → 숫자 (parseInt는 앞 숫자만 추출)
 */
function parseCalorie(calorie) {
  return parseInt(calorie, 10) || 0
}

function getApiKey() {
  const key = import.meta.env.VITE_RECIPE_API_KEY
  if (!key) throw new Error('VITE_RECIPE_API_KEY 환경변수가 설정되지 않았습니다')
  return key
}

/**
 * 레시피 기본정보 API 호출
 * 개발: Vite 프록시 /api-proxy/recipe 경유
 * 프로덕션: 직접 호출 (별도 프록시 서버 필요)
 */
async function fetchRaw(start, end) {
  const apiKey = getApiKey()

  const base = import.meta.env.DEV
    ? `/api-proxy/recipe/${apiKey}/json/${SERVICE_NAME}`
    : `http://211.237.50.150:7080/openapi/${apiKey}/json/${SERVICE_NAME}`

  const res = await fetch(`${base}/${start}/${end}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const json = await res.json()
  const body  = json?.[SERVICE_NAME]

  if (!body) throw new Error('API 응답 형식 오류: 서비스 응답 없음')

  // API는 소문자 result 사용
  const code = body.result?.code ?? body.RESULT?.CODE
  if (code && code !== 'INFO-000') {
    const msg = body.result?.message ?? body.RESULT?.MESSAGE ?? '알 수 없는 오류'
    throw new Error(`API 오류 [${code}]: ${msg}`)
  }

  return body.row ?? []
}

/**
 * API row → 앱 내부 공통 레시피 객체로 정규화
 */
function normalizeRow(row) {
  const cookingMins = parseCookingMins(row.COOKING_TIME)
  const diff = LEVEL_DIFF[row.LEVEL_NM] ?? minsToDiff(cookingMins)

  return {
    id:      row.RECIPE_ID,
    name:    row.RECIPE_NM_KO,
    tyNm:    row.TY_NM,
    nationNm: row.NATION_NM,
    emoji:   TYPE_EMOJI[row.TY_NM] ?? '🍽️',
    diff,
    mins:    `${cookingMins}분`,
    kcal:    parseCalorie(row.CALORIE),
    cost:    parsePcNm(row.PC_NM),    // API 제공 예상 가격 (0이면 추정치 사용)
    servings: row.QNT,
    sumry:   row.SUMRY ?? '',
    irdntCode: row.IRDNT_CODE,        // 재료 분류 (곡류, 육류 등)
  }
}

/**
 * SUMRY(요약 설명)를 단계별 배열로 파싱
 * 기본정보 API에는 상세 조리순서 없음 → SUMRY를 1단계 안내로 사용
 */
export function parseCookingSteps(sumry) {
  if (!sumry) return []
  // 마침표나 느낌표로 문장 분리
  return sumry
    .split(/(?<=[.!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 3)
}

/**
 * 난이도에 맞는 레시피 목록 조회
 * 100건을 가져와 LEVEL_NM 또는 조리시간으로 클라이언트 필터링
 * @param {string} difficulty - '초간단' | '보통' | '도전'
 * @param {number} batchSize  - 필터링 전 가져올 레코드 수
 * @returns {Promise<Array>}  정규화된 레시피 배열
 */
export async function fetchRecipesByDifficulty(difficulty, batchSize = 100) {
  const rows = await fetchRaw(1, batchSize)
  const normalized = rows.map(normalizeRow)

  const filtered = normalized.filter(r => r.diff === difficulty)

  // 해당 난이도 레시피가 3개 미만이면 전체 반환 (선택 풀 확보)
  return filtered.length >= 3 ? filtered : normalized
}
