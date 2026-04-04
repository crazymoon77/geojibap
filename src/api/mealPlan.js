/**
 * 식단 생성 오케스트레이션
 *
 * 데이터 소스: 식품안전나라 COOKRCP01 API
 *   - 재료 목록 (RCP_PARTS_DTLS)
 *   - 단계별 조리 순서 (MANUAL01~20)
 *   - 영양정보 (INFO_ENG/CAR/PRO/FAT)
 *   ※ 가격 정보 없음 → 난이도 기반 추정
 */

import { fetchCookrcpByDifficulty } from './cookrcp.js'
import { FALLBACK_POOL }            from './fallback.js'

const MEAL_SLOTS = [
  { id: 'breakfast', time: '아침' },
  { id: 'lunch',     time: '점심' },
  { id: 'dinner',    time: '저녁' },
]

function determineCost(recipe) {
  if (recipe.cost > 0) return recipe.cost
  return { '초간단': 1800, '보통': 2800, '도전': 4200 }[recipe.diff] ?? 2500
}

function estimateRetailPrice(cost) {
  return Math.ceil((cost * 2.5) / 500) * 500
}

function pickRandom(arr, n) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

function buildMeal(recipe, slotIndex, showTimeLabel) {
  const cost = determineCost(recipe)
  return {
    id:          MEAL_SLOTS[slotIndex].id,
    time:        showTimeLabel ? MEAL_SLOTS[slotIndex].time : '',
    emoji:       recipe.emoji,
    name:        recipe.name,
    cost,
    kcal:        recipe.kcal,
    protein:     recipe.protein,
    carbs:       recipe.carbs,
    fat:         recipe.fat,
    diff:        recipe.diff,
    mins:        recipe.mins,
    retail:      estimateRetailPrice(cost),
    ingredients: recipe.ingredients,
    steps:       recipe.steps,
    irdntCode:   '',
    servings:    recipe.servings,
    sumry:       recipe.sumry,
  }
}

/**
 * 메인 식단 생성
 */
export async function generateMealPlan(settings) {
  const mealsCount    = settings.mealsCount ?? 3
  const showTimeLabel = mealsCount === 3

  try {
    const diffKey = settings.difficulty.replace(/^[^\s]+\s/, '')
    let recipes   = await fetchCookrcpByDifficulty(diffKey, 200)
    if (recipes.length < mealsCount) throw new Error(`레시피 수 부족 (${recipes.length}개)`)

    if (settings.caloriesOn) {
      const calPerMeal = Math.floor(settings.calories / mealsCount)
      const filtered   = recipes.filter(r => r.kcal === 0 || r.kcal <= calPerMeal)
      if (filtered.length >= mealsCount) recipes = filtered
    }

    const selected = pickRandom(recipes, mealsCount)
    return { meals: selected.map((r, i) => buildMeal(r, i, showTimeLabel)), fromApi: true }
  } catch (err) {
    console.warn('[거지밥] API 호출 실패 → 폴백 데이터 사용:', err.message)
    const shuffled = [...FALLBACK_POOL].sort(() => Math.random() - 0.5)
    const meals = shuffled.slice(0, mealsCount).map((recipe, i) => ({
      ...recipe,
      id:     MEAL_SLOTS[i].id,
      time:   showTimeLabel ? MEAL_SLOTS[i].time : '',
      retail: estimateRetailPrice(recipe.cost),
    }))
    return { meals, fromApi: false }
  }
}

/**
 * 특정 끼니 1개만 재생성 (S2Result의 🔄 버튼용)
 * @param {Object} targetMeal  - 교체할 현재 meal 객체
 * @param {Array}  currentMeals - 현재 전체 식단 (이름 중복 방지용)
 * @param {Object} settings
 */
export async function regenerateSingleMeal(targetMeal, currentMeals, settings) {
  const mealsCount    = settings.mealsCount ?? 3
  const showTimeLabel = mealsCount === 3
  const slotIndex     = MEAL_SLOTS.findIndex(s => s.id === targetMeal.id)
  const usedNames     = new Set(currentMeals.map(m => m.name))

  try {
    const diffKey = settings.difficulty.replace(/^[^\s]+\s/, '')
    let recipes   = await fetchCookrcpByDifficulty(diffKey, 200)

    // 현재 식단에 없는 레시피 우선
    const fresh = recipes.filter(r => !usedNames.has(r.name))
    if (fresh.length > 0) recipes = fresh

    if (settings.caloriesOn) {
      const calPerMeal = Math.floor(settings.calories / mealsCount)
      const filtered   = recipes.filter(r => r.kcal === 0 || r.kcal <= calPerMeal)
      if (filtered.length > 0) recipes = filtered
    }

    const [picked] = pickRandom(recipes, 1)
    return buildMeal(picked, slotIndex >= 0 ? slotIndex : 0, showTimeLabel)
  } catch {
    // 폴백 풀에서 뽑기 (현재 식단과 겹치지 않도록)
    const pool   = FALLBACK_POOL.filter(r => !usedNames.has(r.name))
    const source = pool.length > 0 ? pool : FALLBACK_POOL
    const [picked] = pickRandom(source, 1)
    const cost = determineCost(picked)
    return {
      ...picked,
      id:     targetMeal.id,
      time:   targetMeal.time,
      cost,
      retail: estimateRetailPrice(cost),
    }
  }
}
