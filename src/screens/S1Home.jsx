import './S1Home.css'

const DIFFICULTIES = [
  { label: '🟢 초간단', sub: '전자레인지·끓이기' },
  { label: '🟡 보통',   sub: '10~20분 조리' },
  { label: '🔴 도전',   sub: '30분 이상' },
]

const NUTRIENTS = [
  { label: '칼로리',   valKey: 'calories', onKey: 'caloriesOn', unit: 'kcal', step: 100, min: 1000, max: 3000 },
  { label: '단백질',   valKey: 'protein',  onKey: 'proteinOn',  unit: 'g',    step: 5,   min: 40,   max: 120  },
  { label: '탄수화물', valKey: 'carbs',    onKey: 'carbsOn',    unit: 'g',    step: 10,  min: 200,  max: 600  },
]

const BUDGET_MIN  = 5000
const BUDGET_MAX  = 15000
const BUDGET_STEP = 1000

export default function S1Home({ navigate, generateAndNavigate, isLoading, settings, setSettings }) {
  const stepBudget = delta =>
    setSettings(s => ({ ...s, budget: Math.min(BUDGET_MAX, Math.max(BUDGET_MIN, s.budget + delta)) }))

  const stepNutrient = (valKey, delta, min, max) =>
    setSettings(s => ({ ...s, [valKey]: Math.min(max, Math.max(min, s[valKey] + delta)) }))

  return (
    <div className="s1 screen-enter">
      {/* 헤더 */}
      <div className="s1-header">
        <button className="header-back" onClick={() => navigate('s0')}>← 처음으로</button>
        <div className="s1-header-brand">거지밥 🍚</div>
        <div style={{ width: 80 }} />
      </div>
      <p className="s1-header-sub">생각하기 귀찮은데, 정해준대로 먹자</p>

      <div className="s1-body">

        {/* 예산 — 스테퍼 */}
        <p className="s1-section-title">오늘 예산을 설정하세요</p>
        <div className="s1-budget-box">
          <span className="s1-budget-icon">💰</span>
          <button
            className="s1-budget-step"
            onClick={() => stepBudget(-BUDGET_STEP)}
            disabled={settings.budget <= BUDGET_MIN}
            aria-label="예산 줄이기"
          >−</button>
          <div className="s1-budget-center">
            <span className="s1-budget-amount">{settings.budget.toLocaleString()}</span>
            <span className="s1-budget-unit">원</span>
          </div>
          <button
            className="s1-budget-step"
            onClick={() => stepBudget(BUDGET_STEP)}
            disabled={settings.budget >= BUDGET_MAX}
            aria-label="예산 늘리기"
          >+</button>
        </div>
        <p className="s1-section-sub">최소 {BUDGET_MIN.toLocaleString()}원 · 최대 {BUDGET_MAX.toLocaleString()}원</p>

        {/* 끼니 수 */}
        <p className="s1-section-title">하루 몇 끼를 드시나요?</p>
        <p className="s1-section-sub">선택한 끼니 수만큼 식단을 구성합니다</p>
        <div className="s1-meals-box">
          {[1, 2, 3].map(n => (
            <button
              key={n}
              className={`s1-meals-item ${settings.mealsCount === n ? 'active' : ''}`}
              onClick={() => setSettings(s => ({ ...s, mealsCount: n }))}
            >
              <span className="s1-meals-num">{n}끼</span>
              <span className="s1-meals-sub">{n === 1 ? '하루 한 끼' : n === 2 ? '두 끼 식사' : '아침·점심·저녁'}</span>
            </button>
          ))}
        </div>

        {/* 난이도 */}
        <p className="s1-section-title">조리 난이도</p>
        <p className="s1-section-sub">오늘 요리할 의지가 얼마나 되시나요?</p>
        <div className="s1-diff-box">
          {DIFFICULTIES.map(d => (
            <button
              key={d.label}
              className={`s1-diff-item ${settings.difficulty === d.label ? 'active' : ''}`}
              onClick={() => setSettings(s => ({ ...s, difficulty: d.label }))}
            >
              <span className="s1-diff-label">{d.label}</span>
              <span className="s1-diff-sub">{d.sub}</span>
            </button>
          ))}
        </div>

        {/* 영양 목표 */}
        <p className="s1-section-title">영양 목표 <span className="s1-optional">(선택)</span></p>
        <div className="s1-nutri-box">
          {NUTRIENTS.map(n => {
            const val     = settings[n.valKey]
            const enabled = settings[n.onKey]
            return (
              <div key={n.valKey} className="s1-nutri-item">
                <span className="s1-nutri-label">{n.label}</span>
                <div className={`s1-stepper ${!enabled ? 'disabled' : ''}`}>
                  <button
                    className="s1-step-btn"
                    onClick={() => stepNutrient(n.valKey, -n.step, n.min, n.max)}
                    disabled={!enabled || val <= n.min}
                    aria-label={`${n.label} 줄이기`}
                  >−</button>
                  <span className="s1-step-val">
                    {val.toLocaleString()}<span className="s1-step-unit">{n.unit}</span>
                  </span>
                  <button
                    className="s1-step-btn"
                    onClick={() => stepNutrient(n.valKey, n.step, n.min, n.max)}
                    disabled={!enabled || val >= n.max}
                    aria-label={`${n.label} 늘리기`}
                  >+</button>
                </div>
                <div
                  className={`s1-toggle ${enabled ? 'on' : ''}`}
                  onClick={() => setSettings(s => ({ ...s, [n.onKey]: !s[n.onKey] }))}
                  role="switch"
                  aria-checked={enabled}
                >
                  <div className="s1-toggle-knob" />
                </div>
              </div>
            )
          })}
        </div>

        {/* 생성 버튼 */}
        <button
          className="btn-primary s1-generate-btn"
          onClick={generateAndNavigate}
          disabled={isLoading}
        >
          {isLoading ? '식단 생성 중...' : '오늘의 거지밥 생성하기 →'}
        </button>

      </div>
    </div>
  )
}
