import './S2Result.css'

function SkeletonCard() {
  return (
    <div className="s2-card s2-skel-card">
      <div className="s2-skel-row s2-skel-badge" />
      <div className="s2-skel-info-row">
        <div className="s2-skel-circle" />
        <div className="s2-skel-lines">
          <div className="s2-skel-row s2-skel-title" />
          <div className="s2-skel-row s2-skel-sub" />
        </div>
      </div>
      <div className="s2-skel-chips-row">
        <div className="s2-skel-row s2-skel-chip" />
        <div className="s2-skel-row s2-skel-chip" />
        <div className="s2-skel-row s2-skel-chip" />
      </div>
      <div className="s2-skel-row s2-skel-save" />
    </div>
  )
}

export default function S2Result({
  navigate, settings, meals, completedMeals, toggleMeal,
  isLoading, regenerateMeal, regeneratingId,
}) {
  const totalCost    = meals.reduce((s, m) => s + m.cost, 0)
  const totalRetail  = meals.reduce((s, m) => s + m.retail, 0)
  const totalKcal    = meals.reduce((s, m) => s + m.kcal, 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein ?? 0), 0)
  const totalCarbs   = meals.reduce((s, m) => s + (m.carbs ?? 0), 0)
  const usedPct      = Math.round(totalCost / settings.budget * 100)
  const overBudget   = totalCost > settings.budget

  return (
    <div className="s2 screen-enter">
      <div className="screen-header">
        <button className="header-back" onClick={() => navigate('s1')}>← 다시 설정</button>
        <span className="header-title">오늘의 거지밥</span>
        <div className="header-spacer" />
      </div>

      {/* 예산 배너 */}
      <div className="s2-budget-banner">
        <div className="s2-budget-left">
          <span className="s2-budget-label">💰 오늘 예산</span>
          <span className="s2-budget-amount">{settings.budget.toLocaleString()}원</span>
        </div>
        <div className="s2-budget-right">
          <span className="s2-budget-used">식재료 합계  {totalCost.toLocaleString()}원</span>
          {overBudget
            ? <span className="s2-budget-over">예산 초과  {(totalCost - settings.budget).toLocaleString()}원</span>
            : <span className="s2-budget-remain">남은 예산  {(settings.budget - totalCost).toLocaleString()}원</span>
          }
          <div className="s2-progress-bar">
            <div
              className={`s2-progress-fill ${overBudget ? 'over' : ''}`}
              style={{ width: `${Math.min(usedPct, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 영양 요약 */}
      <div className="s2-nutri-bar">
        {[
          { label: '칼로리',   val: `${Math.round(totalKcal).toLocaleString()} kcal` },
          { label: '단백질',   val: `${parseFloat(totalProtein.toFixed(1)).toLocaleString()} g` },
          { label: '탄수화물', val: `${parseFloat(totalCarbs.toFixed(1)).toLocaleString()} g`   },
        ].map(n => (
          <div key={n.label} className="s2-nutri-item">
            <span className="s2-nutri-label">{n.label}</span>
            <span className="s2-nutri-val">{n.val}</span>
          </div>
        ))}
      </div>

      {/* 메뉴 카드 */}
      <div className="s2-meals">
        {isLoading
          ? Array.from({ length: settings.mealsCount ?? 3 }).map((_, i) => <SkeletonCard key={i} />)
          : meals.map(m => {
            const done         = completedMeals.includes(m.id)
            const saved        = m.retail - m.cost
            const isRegen      = regeneratingId === m.id
            const anyRegen     = !!regeneratingId

            return (
              <div key={m.id} className={`s2-card ${done ? 'done' : ''}`}>
                {/* 카드 상단 */}
                <div className="s2-card-top">
                  {m.time && <span className={`s2-time-badge ${done ? 'done' : ''}`}>{m.time}</span>}
                  <div className="s2-card-top-right">
                    {done && <div className="s2-check-icon">✓</div>}
                    <button
                      className={`s2-regen-btn ${isRegen ? 'spinning' : ''}`}
                      onClick={() => regenerateMeal(m.id)}
                      disabled={anyRegen}
                      aria-label="다른 메뉴로 교체"
                    >↺</button>
                  </div>
                </div>

                {/* 메뉴 정보 */}
                <div className="s2-card-info">
                  <span className="s2-card-emoji">{m.emoji}</span>
                  <div className="s2-card-meta">
                    <span className={`s2-card-name ${done ? 'done' : ''}`}>{m.name}</span>
                    <span className="s2-card-cost">식재료 원가  {m.cost.toLocaleString()}원</span>
                  </div>
                  <button className="s2-recipe-btn" onClick={() => navigate('s3', m)}>
                    레시피 보기 →
                  </button>
                </div>

                {/* 태그 */}
                <div className="s2-card-chips">
                  <span className="chip">{m.diff}</span>
                  <span className="chip">⏱ {m.mins}</span>
                  <span className="chip">{Math.round(m.kcal).toLocaleString()}kcal</span>
                </div>

                {/* 절약 금액 */}
                <div className="s2-save-row">
                  <div className="s2-save-divider" />
                  <div className="s2-save-retail">
                    <span className="s2-save-label">외식했다면</span>
                    <span className="s2-save-retail-price">{m.retail.toLocaleString()}원</span>
                  </div>
                  <div className={`s2-save-box ${done ? 'done' : ''}`}>
                    <span className="s2-save-text">🎉 직접 만들어 절약한 금액</span>
                    <span className="s2-save-amount">+{saved.toLocaleString()}원</span>
                  </div>
                </div>

                {/* 완료 버튼 */}
                {!done ? (
                  <button className="s2-done-btn" onClick={() => toggleMeal(m.id)}>
                    ✓  먹었어요! (완료)
                  </button>
                ) : (
                  <div className="s2-done-banner">
                    <span className="s2-done-text">✓  완료! 오늘도 절약 성공 🎉</span>
                    <button className="s2-recipe-again" onClick={() => navigate('s3', m)}>
                      레시피 다시보기
                    </button>
                  </div>
                )}
              </div>
            )
          })
        }
      </div>

      {/* 성적표 이동 */}
      {!isLoading && (
        <div className="s2-bottom">
          <p className="s2-note">* 외식 평균가는 식재료 원가 기준 추정값입니다</p>
          <button className="btn-secondary" onClick={() => navigate('s4')}>
            📊 오늘의 절약 성적표 보기
          </button>
        </div>
      )}
    </div>
  )
}
