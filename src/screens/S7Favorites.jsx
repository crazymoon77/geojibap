import './S7Favorites.css'

export default function S7Favorites({ navigate, navigateToRecipe, favorites, toggleFavorite }) {
  if (!favorites?.length) {
    return (
      <div className="s7 screen-enter">
        <div className="screen-header">
          <button className="header-back" onClick={() => navigate('s0')}>← 처음으로</button>
          <span className="header-title">★ 즐겨찾기</span>
          <div className="header-spacer" />
        </div>
        <div className="s7-empty">
          <span className="s7-empty-icon">☆</span>
          <p className="s7-empty-title">즐겨찾기한 식단이 없어요</p>
          <p className="s7-empty-sub">식단 화면에서 ★ 버튼을 눌러<br />마음에 드는 메뉴를 저장해보세요</p>
          <button className="btn-primary s7-empty-btn" onClick={() => navigate('s1')}>식단 생성하러 가기 →</button>
        </div>
      </div>
    )
  }

  return (
    <div className="s7 screen-enter">
      <div className="screen-header">
        <button className="header-back" onClick={() => navigate('s0')}>← 처음으로</button>
        <span className="header-title">★ 즐겨찾기</span>
        <div className="header-spacer" />
      </div>
      <div className="s7-count-bar">
        <span>저장된 식단 <strong>{favorites.length}개</strong></span>
      </div>
      <div className="s7-list">
        {[...favorites].reverse().map((meal) => (
          <div key={meal.name} className="s7-card">
            <div className="s7-card-main" onClick={() => navigateToRecipe(meal, 's7')}>
              <span className="s7-card-emoji">{meal.emoji}</span>
              <div className="s7-card-info">
                <span className="s7-card-name">{meal.name}</span>
                <div className="s7-card-meta">
                  <span className="s7-chip">{meal.diff}</span>
                  <span className="s7-chip">⏱ {meal.mins}</span>
                  {meal.kcal > 0 && <span className="s7-chip">{Math.round(meal.kcal).toLocaleString()}kcal</span>}
                </div>
                <span className="s7-card-cost">식재료 원가 {meal.cost?.toLocaleString()}원</span>
              </div>
              <span className="s7-card-arrow">→</span>
            </div>
            <button className="s7-unstar-btn" onClick={() => toggleFavorite(meal)}>★ 해제</button>
          </div>
        ))}
      </div>
    </div>
  )
}
