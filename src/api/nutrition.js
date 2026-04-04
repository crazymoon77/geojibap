/**
 * 식품의약품안전처 식품영양성분 데이터베이스 API
 *
 * 엔드포인트: https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02
 * 환경변수:   VITE_NUTRITION_API_KEY
 *
 * 실제 응답 구조 (curl 확인 기준):
 *   {
 *     "header": { "resultCode": "00", "resultMsg": "NORMAL SERVICE." },
 *     "body": {
 *       "pageNo": 1,
 *       "totalCount": 2836,
 *       "numOfRows": 3,
 *       "items": [
 *         {
 *           "FOOD_NM_KR":  "된장찌개_두부",
 *           "SERVING_SIZE": "100g",      // 분석 기준량 (항상 100g)
 *           "Z10500":       "270.000g",  // 1회 제공량
 *           "AMT_NUM1":  "41.00",   // 에너지 (kcal / 100g)
 *           "AMT_NUM2":  "90.70",   // 수분 (g)
 *           "AMT_NUM3":  "3.25",    // 단백질 (g / 100g)
 *           "AMT_NUM4":  "1.96",    // 지방 (g / 100g)
 *           "AMT_NUM5":  "1.56",    // 회분 (g)
 *           "AMT_NUM6":  "2.56",    // 탄수화물 (g / 100g)
 *           ...                     // AMT_NUM7 ~ AMT_NUM157: 미량 영양소
 *         }
 *       ]
 *     }
 *   }
 */

const BASE_URL  = 'https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02'
const OPERATION = 'getFoodNtrCpntDbInq02'

function getApiKey() {
  const key = import.meta.env.VITE_NUTRITION_API_KEY
  if (!key) throw new Error('VITE_NUTRITION_API_KEY 환경변수가 설정되지 않았습니다')
  return key
}

/**
 * 식품명으로 영양성분 조회
 * @param {string} foodName - 검색할 식품명 (예: '두부', '된장찌개')
 * @param {number} limit    - 최대 결과 수 (첫 번째 항목을 대표값으로 사용)
 * @returns {Promise<Array>} 영양성분 item 배열
 */
export async function fetchNutritionByName(foodName, limit = 5) {
  const apiKey = getApiKey()
  const params = new URLSearchParams({
    serviceKey: apiKey,
    pageNo:     '1',
    numOfRows:  String(limit),
    type:       'json',
    FOOD_NM_KR: foodName,
  })

  const res = await fetch(`${BASE_URL}/${OPERATION}?${params.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: 영양성분 API`)

  const json = await res.json()

  const resultCode = json?.header?.resultCode
  if (resultCode && resultCode !== '00') {
    throw new Error(`영양성분 API 오류 [${resultCode}]: ${json?.header?.resultMsg}`)
  }

  const items = json?.body?.items
  if (!items) return []
  return Array.isArray(items) ? items : [items]
}

/**
 * API item → 정규화된 영양성분 객체
 *
 * AMT_NUM* 필드는 모두 100g 기준값.
 * Z10500(1회 제공량)이 있으면 실제 1인분 기준으로 환산.
 *
 * @param {Object} item - API 응답 items 배열의 원소
 * @returns {{ kcal, protein, carbs, fat }}
 */
export function parseNutritionRow(item) {
  // Z10500: "270.000g" → 270, 없으면 100g 기준 그대로 사용
  const servingG = parseFloat(item.Z10500) || 100
  const ratio    = servingG / 100

  return {
    kcal:    Math.round((parseFloat(item.AMT_NUM1) || 0) * ratio),
    protein: Math.round((parseFloat(item.AMT_NUM3) || 0) * ratio * 10) / 10,
    fat:     Math.round((parseFloat(item.AMT_NUM4) || 0) * ratio * 10) / 10,
    carbs:   Math.round((parseFloat(item.AMT_NUM6) || 0) * ratio * 10) / 10,
  }
}
