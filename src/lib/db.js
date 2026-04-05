import { supabase } from './supabase'
import { loadAllPlans, loadFavorites } from '../api/storage'

export async function fetchSettings(userId) {
  if (!supabase) return null
  try {
    const { data } = await supabase.from('user_settings').select('settings').eq('user_id', userId).single()
    return data?.settings ?? null
  } catch { return null }
}

export async function upsertSettings(userId, settings) {
  if (!supabase) return
  try {
    await supabase.from('user_settings')
      .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  } catch {}
}

export async function fetchMealHistory(userId) {
  if (!supabase) return {}
  try {
    const { data } = await supabase.from('meal_history').select('date, meals, completed_meals').eq('user_id', userId)
    if (!data) return {}
    return Object.fromEntries(data.map(r => [r.date, { meals: r.meals, completedMeals: r.completed_meals }]))
  } catch { return {} }
}

export async function upsertMealHistory(userId, dateStr, meals, completedMeals) {
  if (!supabase) return
  try {
    await supabase.from('meal_history')
      .upsert({ user_id: userId, date: dateStr, meals, completed_meals: completedMeals, updated_at: new Date().toISOString() }, { onConflict: 'user_id,date' })
  } catch {}
}

export async function fetchFavorites(userId) {
  if (!supabase) return []
  try {
    const { data } = await supabase.from('favorites').select('meal').eq('user_id', userId).order('saved_at', { ascending: true })
    return data?.map(r => r.meal) ?? []
  } catch { return [] }
}

export async function upsertFavorite(userId, meal) {
  if (!supabase) return
  try {
    await supabase.from('favorites')
      .upsert({ user_id: userId, meal_name: meal.name, meal, saved_at: meal.savedAt ?? new Date().toISOString() }, { onConflict: 'user_id,meal_name' })
  } catch {}
}

export async function deleteFavorite(userId, mealName) {
  if (!supabase) return
  try {
    await supabase.from('favorites').delete().eq('user_id', userId).eq('meal_name', mealName)
  } catch {}
}

export async function syncLocalStorageToSupabase(userId) {
  if (!supabase) return
  try {
    for (const [dateStr, plan] of Object.entries(loadAllPlans())) {
      await upsertMealHistory(userId, dateStr, plan.meals, plan.completedMeals ?? [])
    }
    for (const fav of loadFavorites()) {
      await upsertFavorite(userId, fav)
    }
  } catch {}
}
