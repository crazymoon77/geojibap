import { useState, useEffect, useRef } from 'react'
import S0Intro     from './screens/S0Intro'
import S1Home      from './screens/S1Home'
import S2Result    from './screens/S2Result'
import S3Recipe    from './screens/S3Recipe'
import S4Summary   from './screens/S4Summary'
import S5Calendar  from './screens/S5Calendar'
import S6Shopping  from './screens/S6Shopping'
import S7Favorites from './screens/S7Favorites'
import S8Auth      from './screens/S8Auth'
import { generateMealPlan, regenerateSingleMeal } from './api/mealPlan'
import { FALLBACK_MEALS } from './api/fallback'
import {
  todayStr, loadPlanByDate, savePlanByDate, migrateOldPlan,
  loadFavorites, saveFavorites,
} from './api/storage'
import { supabase } from './lib/supabase'
import {
  fetchSettings, upsertSettings,
  fetchMealHistory, upsertMealHistory,
  fetchFavorites, upsertFavorite, deleteFavorite,
  syncLocalStorageToSupabase,
} from './lib/db'
import './App.css'

export default function App() {
  useEffect(() => { migrateOldPlan() }, [])

  const today = todayStr()

  // ── 인증 ────────────────────────────────────────────
  const [user, setUser] = useState(null)
  const hasSynced = useRef(false)
  const settingsSyncReady = useRef(false)

  useEffect(() => {
    if (!supabase) return
    let sub = null
    try {
      supabase.auth.getSession()
        .then(({ data }) => setUser(data?.session?.user ?? null))
        .catch(() => {})
      const result = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
      sub = result?.data?.subscription
    } catch {}
    return () => sub?.unsubscribe()
  }, [])

  // 로그인 후 1회 동기화
  useEffect(() => {
    if (!user || hasSynced.current) return
    hasSynced.current = true
    ;(async () => {
      try {
        await syncLocalStorageToSupabase(user.id)
        const remoteSettings = await fetchSettings(user.id)
        if (remoteSettings) setSettings(remoteSettings)
        settingsSyncReady.current = true
        const history = await fetchMealHistory(user.id)
        const plan = history[today]
        if (plan) { setMeals(plan.meals); setCompletedMeals(plan.completedMeals ?? []); setHasPlan(true) }
        const remoteFavs = await fetchFavorites(user.id)
        if (remoteFavs.length > 0) setFavorites(remoteFavs)
      } catch { settingsSyncReady.current = true }
    })()
  }, [user])

  // ── 상태 ────────────────────────────────────────────
  const [screen, setScreen]             = useState('s0')
  const [recipeBackTo, setRecipeBackTo] = useState('s2')
  const [selectedDate, setSelectedDate] = useState(today)
  const [settings, setSettings]         = useState({
    budget: 10000, mealsCount: 3, difficulty: '🟡 보통',
    calories: 2000, caloriesOn: true,
    protein: 60,   proteinOn:  true,
    carbs: 300,    carbsOn:    false,
  })
  const [meals, setMeals]                   = useState(() => loadPlanByDate(today)?.meals ?? FALLBACK_MEALS)
  const [isLoading, setIsLoading]           = useState(false)
  const [completedMeals, setCompletedMeals] = useState(() => loadPlanByDate(today)?.completedMeals ?? [])
  const [selectedRecipe, setSelectedRecipe] = useState(null)
  const [hasPlan, setHasPlan]               = useState(() => !!loadPlanByDate(today))
  const [regeneratingId, setRegeneratingId] = useState(null)
  const [favorites, setFavorites]           = useState(() => loadFavorites())

  // PWA
  const [pwaPrompt, setPwaPrompt]     = useState(null)
  const [showPwaBanner, setShowPwaBanner] = useState(false)
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setPwaPrompt(e); setShowPwaBanner(true) }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])
  const handlePwaInstall = async () => {
    if (!pwaPrompt) return
    pwaPrompt.prompt()
    const { outcome } = await pwaPrompt.userChoice
    if (outcome === 'accepted') { setShowPwaBanner(false); setPwaPrompt(null) }
  }

  // 날짜 변경 시 해당 식단 로드
  const prevDate = useRef(today)
  useEffect(() => {
    if (prevDate.current === selectedDate) return
    prevDate.current = selectedDate
    const plan = loadPlanByDate(selectedDate)
    setMeals(plan?.meals ?? FALLBACK_MEALS)
    setCompletedMeals(plan?.completedMeals ?? [])
    setHasPlan(!!plan)
  }, [selectedDate])

  // ── 저장 ────────────────────────────────────────────
  useEffect(() => {
    if (hasPlan) {
      savePlanByDate(selectedDate, meals, completedMeals)
      if (user) upsertMealHistory(user.id, selectedDate, meals, completedMeals)
    }
  }, [meals, completedMeals, hasPlan, selectedDate])

  useEffect(() => { saveFavorites(favorites) }, [favorites])

  useEffect(() => {
    if (user && settingsSyncReady.current) upsertSettings(user.id, settings)
  }, [settings, user])

  // ── 이동 ────────────────────────────────────────────
  const navigate = (to, data = null) => {
    if (data) setSelectedRecipe(data)
    setScreen(to)
    window.scrollTo(0, 0)
  }
  const navigateToRecipe = (meal, backTo = 's2') => {
    setSelectedRecipe(meal); setRecipeBackTo(backTo); setScreen('s3'); window.scrollTo(0, 0)
  }

  // ── 식단 생성 ────────────────────────────────────────
  const generateAndNavigate = async () => {
    setIsLoading(true); setCompletedMeals([]); setHasPlan(false); navigate('s2')
    try {
      const { meals: newMeals } = await generateMealPlan(settings)
      setMeals(newMeals); setHasPlan(true)
    } finally { setIsLoading(false) }
  }

  const regenerateMeal = async (mealId) => {
    if (regeneratingId) return
    setRegeneratingId(mealId)
    try {
      const target  = meals.find(m => m.id === mealId)
      const newMeal = await regenerateSingleMeal(target, meals, settings)
      setMeals(prev => prev.map(m => m.id === mealId ? newMeal : m))
      setCompletedMeals(prev => prev.filter(id => id !== mealId))
    } finally { setRegeneratingId(null) }
  }

  const toggleMeal = (mealId) => setCompletedMeals(prev =>
    prev.includes(mealId) ? prev.filter(id => id !== mealId) : [...prev, mealId]
  )

  const toggleFavorite = (meal) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.name === meal.name)
      if (exists) {
        if (user) deleteFavorite(user.id, meal.name)
        return prev.filter(f => f.name !== meal.name)
      }
      const newMeal = { ...meal, savedAt: new Date().toISOString() }
      if (user) upsertFavorite(user.id, newMeal)
      return [...prev, newMeal]
    })
  }
  const isFavorited = (mealName) => favorites.some(f => f.name === mealName)
  const logout = () => supabase?.auth.signOut()

  const props = {
    navigate, navigateToRecipe,
    generateAndNavigate, isLoading,
    settings, setSettings,
    meals, completedMeals, toggleMeal,
    selectedRecipe, recipeBackTo,
    regenerateMeal, regeneratingId,
    hasPlan, selectedDate, setSelectedDate, today,
    favorites, toggleFavorite, isFavorited,
    user, logout,
  }

  return (
    <div className="app-wrapper">
      {showPwaBanner && (
        <div className="pwa-banner">
          <span className="pwa-banner-text">🍚 거지밥을 홈 화면에 추가하세요</span>
          <button className="pwa-banner-install" onClick={handlePwaInstall}>설치</button>
          <button className="pwa-banner-close" onClick={() => setShowPwaBanner(false)}>✕</button>
        </div>
      )}
      {screen === 's0' && <S0Intro     {...props} />}
      {screen === 's1' && <S1Home      {...props} />}
      {screen === 's2' && <S2Result    {...props} />}
      {screen === 's3' && <S3Recipe    {...props} />}
      {screen === 's4' && <S4Summary   {...props} />}
      {screen === 's5' && <S5Calendar  {...props} />}
      {screen === 's6' && <S6Shopping  {...props} />}
      {screen === 's7' && <S7Favorites {...props} />}
      {screen === 's8' && <S8Auth      {...props} />}
    </div>
  )
}
