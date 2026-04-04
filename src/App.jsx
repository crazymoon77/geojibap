import { useState, useEffect } from 'react'
import S0Intro    from './screens/S0Intro'
import S1Home     from './screens/S1Home'
import S2Result   from './screens/S2Result'
import S3Recipe   from './screens/S3Recipe'
import S4Summary  from './screens/S4Summary'
import S5Calendar from './screens/S5Calendar'
import { generateMealPlan, regenerateSingleMeal } from './api/mealPlan'
import { FALLBACK_MEALS } from './api/fallback'
import { loadTodayPlan, saveTodayPlan } from './api/storage'
import './App.css'

export default function App() {
  // ── 상태 초기화 (lazy: localStorage는 첫 렌더에만 읽음) ──
  const [screen, setScreen]           = useState('s0')  // 항상 인트로에서 시작
  const [settings, setSettings]       = useState({
    budget:     10000,
    mealsCount:  3,
    difficulty: '🟡 보통',
    calories:    2000,
    caloriesOn:  true,
    protein:     60,
    proteinOn:   true,
    carbs:       300,
    carbsOn:     false,
  })
  const [meals, setMeals]                   = useState(() => loadTodayPlan()?.meals ?? FALLBACK_MEALS)
  const [isLoading, setIsLoading]           = useState(false)
  const [completedMeals, setCompletedMeals] = useState(() => loadTodayPlan()?.completedMeals ?? [])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [hasPlan, setHasPlan]               = useState(() => !!loadTodayPlan())
  const [regeneratingId, setRegeneratingId] = useState(null)

  // ── localStorage 저장 ────────────────────────────────
  useEffect(() => {
    if (hasPlan) saveTodayPlan(meals, completedMeals)
  }, [meals, completedMeals, hasPlan])

  // ── 화면 이동 ────────────────────────────────────────
  const navigate = (to, data = null) => {
    if (data) setSelectedRecipe(data)
    setScreen(to)
    window.scrollTo(0, 0)
  }

  // ── 식단 생성: S2로 즉시 이동 후 API 비동기 로딩 (스켈레톤) ──
  const generateAndNavigate = async () => {
    setIsLoading(true)
    setCompletedMeals([])
    setHasPlan(false)
    navigate('s2')
    try {
      const { meals: newMeals } = await generateMealPlan(settings)
      setMeals(newMeals)
      setHasPlan(true)
    } finally {
      setIsLoading(false)
    }
  }

  // ── 특정 끼니 1개 재생성 ─────────────────────────────
  const regenerateMeal = async (mealId) => {
    if (regeneratingId) return
    setRegeneratingId(mealId)
    try {
      const target  = meals.find(m => m.id === mealId)
      const newMeal = await regenerateSingleMeal(target, meals, settings)
      setMeals(prev => prev.map(m => m.id === mealId ? newMeal : m))
      setCompletedMeals(prev => prev.filter(id => id !== mealId))
    } finally {
      setRegeneratingId(null)
    }
  }

  // ── 완료 토글 ────────────────────────────────────────
  const toggleMeal = (mealId) => {
    setCompletedMeals(prev =>
      prev.includes(mealId) ? prev.filter(id => id !== mealId) : [...prev, mealId]
    )
  }

  const props = {
    navigate,
    generateAndNavigate,
    isLoading,
    settings,
    setSettings,
    meals,
    completedMeals,
    toggleMeal,
    selectedRecipe,
    regenerateMeal,
    regeneratingId,
    hasPlan,
  }

  return (
    <div className="app-wrapper">
      {screen === 's0' && <S0Intro    {...props} />}
      {screen === 's1' && <S1Home     {...props} />}
      {screen === 's2' && <S2Result   {...props} />}
      {screen === 's3' && <S3Recipe   {...props} />}
      {screen === 's4' && <S4Summary  {...props} />}
      {screen === 's5' && <S5Calendar {...props} />}
    </div>
  )
}
