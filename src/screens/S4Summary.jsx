import { useEffect, useState } from 'react'
import './S4Summary.css'
import { recordTodaySaving, getMonthlyTotal } from '../api/storage'

export default function S4Summary({ navigate, meals, completedMeals, settings }) {
  const totalCost    = meals.reduce((s, m) => s + m.cost, 0)
  const totalRetail  = meals.reduce((s, m) => s + m.retail, 0)
  const totalSaved   = totalRetail - totalCost
  const totalKcal    = meals.reduce((s, m) => s + m.kcal, 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein ?? 0), 0)
  const totalCarbs   = meals.reduce((s, m) => s + (m.carbs ?? 0), 0)

  // 성적표를 볼 때마다 오늘 절약액 기록 후 월간 합계 갱신
  const [monthlyTotal, setMonthlyTotal] = useState(getMonthlyTotal)
  useEffect(() => {
    if (totalSaved > 0) {
      recordTodaySaving(totalSaved)
      setMonthlyTotal(getMonthlyTotal())
    }
  }, [totalSaved])

  const nutrients = [
    {
      label:   '칼로리',
      val:     totalKcal,
      unit:    'kcal',
      target:  settings?.calories   ?? 2000,
      enabled: settings?.caloriesOn ?? true,
    },
    {
      label:   '단백질',
      val:     totalProtein,
      unit:    'g',
      target:  settings?.protein   ?? 60,
      enabled: settings?.proteinOn ?? true,
    },
    {
      label:   '탄수화물',
      val:     totalCarbs,
      unit:    'g',
      target:  settings?.carbs   ?? 300,
      enabled: settings?.carbsOn ?? false,
    },
  ].map(n => ({
    ...n,
    pct:     n.target > 0 ? Math.round(n.val / n.target * 100) : 0,
    display: n.unit === 'kcal'
      ? Math.round(n.val).toLocaleString()
      : parseFloat(n.val.toFixed(1)).toLocaleString(),
  }))

  const handleShare = () => {
    const text = `오늘 거지밥으로 ${totalSaved.toLocaleString()}원 절약했어요! 이번 달 누적 ${monthlyTotal.toLocaleString()}원 절약 🍚🏆`
    if (navigator.share) {
      navigator.share({ title: '거지밥 절약 성적표', text })
    } else {
      navigator.clipboard.writeText(text)
      alert('절약 내역이 복사됐습니다!')
    }
  }

  return (
    <div className="s4 screen-enter">
      <div className="screen-header">
        <button className="header-back" onClick={() => navigate('s2')}>← 식단으로</button>
        <span className="header-title">오늘의 절약 성적표</span>
        <div className="header-spacer" />
      </div>

      {/* 메인 성취 배너 */}
      <div className="s4-achievement">
        <p className="s4-ach-title">🏆 오늘 하루 절약 완료!</p>
        <p className="s4-ach-sub">직접 요리해서 아낀 총 금액</p>
        <div className="s4-ach-amount">
          <span className="s4-ach-number">+{totalSaved.toLocaleString()}원</span>
          <span className="s4-ach-unit">절약</span>
        </div>
        <div className="s4-ach-compare">
          <span>외식 예상 비용: {totalRetail.toLocaleString()}원</span>
          <span className="s4-ach-actual">실제 지출: {totalCost.toLocaleString()}원</span>
        </div>
        {monthlyTotal > 0 && (
          <button className="s4-ach-monthly-btn" onClick={() => navigate('s5')}>
            <span className="s4-ach-monthly-left">
              <span className="s4-ach-monthly-icon">📅</span>
              <span>
                <span className="s4-ach-monthly-label">이번 달 누적 절약</span>
                <span className="s4-ach-monthly-amount">+{monthlyTotal.toLocaleString()}원</span>
              </span>
            </span>
            <span className="s4-ach-monthly-arrow">캘린더 →</span>
          </button>
        )}
      </div>

      {/* 메뉴별 절약 내역 */}
      <div className="s4-section">
        <h3 className="s4-section-title">메뉴별 절약 내역</h3>
        <div className="s4-meal-list">
          {meals.map(m => {
            const done  = completedMeals.includes(m.id)
            const saved = m.retail - m.cost
            return (
              <div key={m.id} className={`s4-meal-row ${done ? 'done' : ''}`}>
                <div className="s4-meal-top">
                  {m.time && <span className={`s4-meal-badge ${done ? 'done' : ''}`}>{m.time}</span>}
                  <span className={`s4-meal-status ${done ? 'done' : ''}`}>
                    {done ? '✓ 완료' : '진행중'}
                  </span>
                </div>
                <p className="s4-meal-name">{m.name}</p>
                <p className="s4-meal-compare">
                  식재료 {m.cost.toLocaleString()}원  /  외식 {m.retail.toLocaleString()}원
                </p>
                <div className="s4-meal-save">
                  <span className="s4-save-label">절약</span>
                  <span className="s4-save-val">+{saved.toLocaleString()}원</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 영양 섭취 현황 */}
      <div className="s4-section">
        <h3 className="s4-section-title">영양 섭취 현황</h3>
        <div className="s4-nutri-card">
          {nutrients.map(n => {
            const met  = n.enabled && n.pct >= 80 && n.pct <= 120
            const over = n.enabled && n.pct > 120
            return (
              <div key={n.label} className="s4-nutri-item">
                <span className="s4-nutri-label">{n.label}</span>
                <span className="s4-nutri-val">
                  {n.display}
                  <span className="s4-nutri-unit">{n.unit}</span>
                  {n.enabled && (
                    <span className="s4-nutri-target"> / {n.target.toLocaleString()}{n.unit}</span>
                  )}
                </span>
                {n.enabled ? (
                  <>
                    <div className="s4-nutri-bar-bg">
                      <div
                        className={`s4-nutri-bar-fill ${met ? 'met' : over ? 'over' : ''}`}
                        style={{ width: `${Math.min(n.pct, 100)}%` }}
                      />
                    </div>
                    <span className={`s4-nutri-pct ${met ? 'met' : over ? 'over' : ''}`}>
                      {n.pct}%
                    </span>
                  </>
                ) : (
                  <span className="s4-nutri-free">목표 없음</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="s4-actions">
        <button className="btn-secondary" onClick={handleShare}>
          📤 절약 내역 공유하기
        </button>
        <button className="btn-primary" onClick={() => navigate('s1')}>
          내일도 거지밥 만들기 →
        </button>
      </div>
    </div>
  )
}
