/**
 * localStorage 관리 모듈
 *
 * geojibap_plan_v1    : 오늘의 식단 + 완료 상태 (날짜가 바뀌면 무효화)
 * geojibap_savings_v1 : 날짜별 절약 기록 배열, 최근 60일 보관
 *
 * ⚠️ toISOString()은 UTC 기준이라 KST 자정 전후 날짜가 하루 틀림 → 로컬 날짜 함수 사용
 */

function localDateStr(d = new Date()) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

const TODAY      = () => localDateStr()
const THIS_MONTH = () => TODAY().slice(0, 7)

// ── 오늘의 식단 ──────────────────────────────────────
export function loadTodayPlan() {
  try {
    const raw = localStorage.getItem('geojibap_plan_v1')
    if (!raw) return null
    const data = JSON.parse(raw)
    return data.date === TODAY() ? data : null
  } catch { return null }
}

export function saveTodayPlan(meals, completedMeals) {
  try {
    localStorage.setItem('geojibap_plan_v1', JSON.stringify({
      date: TODAY(), meals, completedMeals,
    }))
  } catch {}
}

// ── 절약 이력 ─────────────────────────────────────────
export function loadSavings() {
  try {
    const raw = localStorage.getItem('geojibap_savings_v1')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

/** 오늘 절약액을 기록 (같은 날 여러 번 호출해도 마지막 값으로 덮어씀) */
export function recordTodaySaving(saved) {
  try {
    const today   = TODAY()
    const history = loadSavings().filter(s => s.date !== today)
    history.push({ date: today, saved })
    localStorage.setItem('geojibap_savings_v1', JSON.stringify(history.slice(-60)))
  } catch {}
}

/** 이번 달 누적 절약액 */
export function getMonthlyTotal() {
  const month = THIS_MONTH()
  return loadSavings()
    .filter(s => s.date.startsWith(month))
    .reduce((sum, s) => sum + s.saved, 0)
}
