function localDateStr(d = new Date()) {
  return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-')
}

export const todayStr = () => localDateStr()

// ── 날짜별 식단 ───────────────────────────────────────
const PLANS_KEY = 'geojibap_plans_v2'

export function loadAllPlans() {
  try { return JSON.parse(localStorage.getItem(PLANS_KEY) || '{}') } catch { return {} }
}

export function loadPlanByDate(dateStr) {
  return loadAllPlans()[dateStr] ?? null
}

export function savePlanByDate(dateStr, meals, completedMeals) {
  try {
    const plans = loadAllPlans()
    plans[dateStr] = { meals, completedMeals }
    const keys = Object.keys(plans).sort()
    if (keys.length > 60) keys.slice(0, keys.length - 60).forEach(k => delete plans[k])
    localStorage.setItem(PLANS_KEY, JSON.stringify(plans))
  } catch {}
}

export function migrateOldPlan() {
  try {
    const raw = localStorage.getItem('geojibap_plan_v1')
    if (!raw) return
    const data = JSON.parse(raw)
    if (data?.date && data?.meals) savePlanByDate(data.date, data.meals, data.completedMeals ?? [])
    localStorage.removeItem('geojibap_plan_v1')
  } catch {}
}

// ── 절약 이력 ─────────────────────────────────────────
export function loadSavings() {
  try { return JSON.parse(localStorage.getItem('geojibap_savings_v1') || '[]') } catch { return [] }
}

export function recordSavingForDate(dateStr, saved) {
  try {
    const history = loadSavings().filter(s => s.date !== dateStr)
    history.push({ date: dateStr, saved })
    localStorage.setItem('geojibap_savings_v1', JSON.stringify(history.slice(-60)))
  } catch {}
}

export function getMonthlyTotal(monthStr) {
  const month = monthStr ?? localDateStr().slice(0, 7)
  return loadSavings().filter(s => s.date.startsWith(month)).reduce((sum, s) => sum + s.saved, 0)
}

// ── 즐겨찾기 ──────────────────────────────────────────
const FAVORITES_KEY = 'geojibap_favorites_v1'

export function loadFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
}

export function saveFavorites(favorites) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)) } catch {}
}
