import './S3Recipe.css'
import { FALLBACK_MEALS } from '../api/fallback'
import { getCoupangUrl } from '../lib/coupang'

const DEFAULT_RECIPE = FALLBACK_MEALS[1]

export default function S3Recipe({ navigate, selectedRecipe, toggleMeal, completedMeals }) {
  const recipe = selectedRecipe || DEFAULT_RECIPE
  const saved  = recipe.retail - recipe.cost
  const done   = completedMeals.includes(recipe.id)

  const ingredients    = recipe.ingredients ?? []
  const steps          = recipe.steps       ?? []
  const hasIngredients = ingredients.length > 0
  const hasSteps       = steps.length > 0

  return (
    <div className="s3 screen-enter">
      <div className="screen-header">
        <button className="header-back" onClick={() => navigate('s2')}>← 식단으로</button>
        <span className="header-title">레시피 상세</span>
        <div className="header-spacer" />
      </div>

      {/* 타이틀 카드 */}
      <div className="s3-title-card">
        <div className="s3-title-left">
          <h2 className="s3-title-name">{recipe.emoji} {recipe.name}</h2>
          <p className="s3-title-meta">
            {recipe.servings || '1인분'}  |  {recipe.mins}  |  난이도 {recipe.diff}
          </p>
        </div>
        <div className="s3-title-right">
          <span className="s3-title-cost">{recipe.cost.toLocaleString()}원</span>
          <span className="s3-title-cost-label">식재료 원가</span>
        </div>
      </div>

      {/* 절약 강조 */}
      <div className="s3-save-line">
        <span className="s3-save-icon">🎉 외식 대비 절약</span>
        <span className="s3-save-detail">
          {recipe.retail.toLocaleString()}원 → {recipe.cost.toLocaleString()}원  |  +{saved.toLocaleString()}원 절약
        </span>
      </div>

      {/* 재료 */}
      <div className="s3-section">
        <h3 className="s3-section-title">재료</h3>
        {hasIngredients ? (
          <div className="s3-ingredient-list">
            {ingredients.map((ing, i) => (
              <div key={`${ing.name}-${i}`} className={`s3-ingredient-row ${i % 2 === 0 ? 'even' : 'odd'}`}>
                <span className="s3-ing-name">{ing.name}</span>
                <span className="s3-ing-amount">{ing.amount}</span>
                <span className="s3-ing-price">{ing.price}</span>
                <a
                  href={getCoupangUrl(ing.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="s3-ing-buy"
                  onClick={e => e.stopPropagation()}
                >
                  🛒
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="s3-info-box">
            {recipe.irdntCode && (
              <div className="s3-info-row">
                <span className="s3-info-label">주재료 분류</span>
                <span className="s3-info-val">{recipe.irdntCode}</span>
              </div>
            )}
            {recipe.servings && (
              <div className="s3-info-row">
                <span className="s3-info-label">분량</span>
                <span className="s3-info-val">{recipe.servings}</span>
              </div>
            )}
            <p className="s3-empty">
              현재 API에서 상세 재료 목록을 제공하지 않습니다
            </p>
          </div>
        )}
      </div>

      {/* 조리 순서 */}
      <div className="s3-section">
        <h3 className="s3-section-title">조리 안내</h3>
        {hasSteps ? (
          <div className="s3-steps">
            {steps.map((step, i) => (
              <div key={i} className="s3-step-row">
                <div className="s3-step-num">{i + 1}</div>
                <div className="s3-step-box">{step}</div>
              </div>
            ))}
          </div>
        ) : recipe.sumry ? (
          <div className="s3-sumry-box">{recipe.sumry}</div>
        ) : (
          <p className="s3-empty">조리 순서 정보를 불러올 수 없습니다</p>
        )}
      </div>

      {/* 완료 버튼 */}
      <div className="s3-actions">
        {!done ? (
          <button className="btn-primary" onClick={() => { toggleMeal(recipe.id); navigate('s2') }}>
            ✓  먹었어요! (완료로 표시)
          </button>
        ) : (
          <div className="s3-done-banner">
            ✓  이미 완료한 식사입니다 🎉
          </div>
        )}
      </div>
    </div>
  )
}
