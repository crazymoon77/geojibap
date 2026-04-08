import { useState } from 'react'
import './S6Shopping.css'
import { getCoupangUrl } from '../lib/coupang'

export const getCoupangLink = getCoupangUrl
export const getNaverShoppingLink = (name) => `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(name)}`

export default function S6Shopping({ navigate, meals }) {
  const groups = (meals || [])
    .filter(m => m.ingredients?.length > 0)
    .map(m => ({ mealName: m.name, emoji: m.emoji, time: m.time, ingredients: m.ingredients }))

  const allIngredients = groups.flatMap(g => g.ingredients.map(ing => ({ ...ing, mealName: g.mealName })))
  const [checked, setChecked] = useState(() => new Set())

  const toggle = (key) => setChecked(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const doneCount  = checked.size
  const totalCount = allIngredients.length

  return (
    <div className="s6 screen-enter">
      <div className="screen-header">
        <button className="header-back" onClick={() => navigate('s2')}>← 식단으로</button>
        <span className="header-title">🛒 장보기 리스트</span>
        <div className="header-spacer" />
      </div>

      <div className="s6-summary">
        <div className="s6-summary-left">
          <span className="s6-summary-count">{doneCount}/{totalCount}</span>
          <span className="s6-summary-label">항목 완료</span>
        </div>
        <div className="s6-progress-bar">
          <div className="s6-progress-fill" style={{ width: totalCount ? `${(doneCount/totalCount)*100}%` : '0%' }} />
        </div>
        {doneCount > 0 && (
          <button className="s6-reset-btn" onClick={() => setChecked(new Set())}>초기화</button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="s6-empty"><p>재료 정보가 있는 메뉴가 없어요.</p></div>
      ) : (
        <div className="s6-body">
          {groups.map((g, gi) => (
            <div key={gi} className="s6-group">
              <div className="s6-group-title">
                <span>{g.emoji} {g.mealName}</span>
                {g.time && <span className="s6-group-time">{g.time}</span>}
              </div>
              {g.ingredients.map((ing, ii) => {
                const key = `${gi}-${ii}`
                const done = checked.has(key)
                return (
                  <div key={key} className={`s6-item ${done ? 'done' : ''}`} onClick={() => toggle(key)}>
                    <div className={`s6-checkbox ${done ? 'checked' : ''}`}>{done && <span>✓</span>}</div>
                    <div className="s6-item-info">
                      <span className="s6-item-name">{ing.name}</span>
                      {ing.amount && <span className="s6-item-amount">{ing.amount}</span>}
                    </div>
                    <div className="s6-item-links" onClick={e => e.stopPropagation()}>
                      <a href={getCoupangUrl(ing.name)} target="_blank" rel="noopener noreferrer" className="s6-buy-btn s6-buy-coupang">쿠팡</a>
                      <a href={getNaverShoppingLink(ing.name)} target="_blank" rel="noopener noreferrer" className="s6-buy-btn s6-buy-naver">네이버</a>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
