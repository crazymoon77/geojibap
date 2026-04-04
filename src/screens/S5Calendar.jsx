import './S5Calendar.css'
import { loadSavings } from '../api/storage'

const DAY_NAMES   = ['일', '월', '화', '수', '목', '금', '토']
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']

/** ⚠️ toISOString()은 UTC 기준 → 로컬 날짜 문자열 직접 생성 */
function localStr(d) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * 연속 절약 일수 계산
 * - while(true) 대신 최대 365회 이터레이션으로 무한루프 방지
 * - noon(12:00)으로 고정해 DST 경계 오류 방지
 */
function calcStreak(allSavingsMap, todayStr) {
  let streak = 0
  const cursor = new Date()
  cursor.setHours(12, 0, 0, 0)
  // 오늘 기록 없으면 어제부터 체크
  if (!allSavingsMap[todayStr]) cursor.setDate(cursor.getDate() - 1)
  for (let i = 0; i < 365; i++) {
    const ds = localStr(cursor)
    if (!allSavingsMap[ds]) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function motivationMsg(days) {
  if (days === 0) return '오늘 첫 거지밥을 만들어봐요 💪'
  if (days <= 3)  return '잘 시작했어요! 꾸준히 이어가요 🌱'
  if (days <= 7)  return '한 주를 절약으로 채웠어요 🎉'
  if (days <= 14) return '절약이 습관이 되고 있어요 🔥'
  return '이달의 절약 고수! 완전 대단해요 🏆'
}

export default function S5Calendar({ navigate }) {
  const now      = new Date()
  const todayStr = localStr(now)
  const year     = now.getFullYear()
  const month    = now.getMonth()   // 0-indexed
  const monthPfx = `${year}-${String(month + 1).padStart(2, '0')}`

  // ── 데이터 로드 ─────────────────────────────────────
  const allSavings    = loadSavings()
  const allSavingsMap = Object.fromEntries(allSavings.map(s => [s.date, s.saved]))

  const thisMonthSavings = allSavings.filter(s => s.date.startsWith(monthPfx))
  const monthSavedMap    = Object.fromEntries(thisMonthSavings.map(s => [s.date, s.saved]))

  // ── 통계 ─────────────────────────────────────────────
  const totalDays  = thisMonthSavings.length
  const totalSaved = thisMonthSavings.reduce((s, r) => s + r.saved, 0)
  const streak     = calcStreak(allSavingsMap, todayStr)

  // ── 캘린더 셀 구성 ────────────────────────────────────
  const firstDow    = new Date(year, month, 1).getDay()   // 0=일
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${monthPfx}-${String(d).padStart(2, '0')}`
    const saved   = monthSavedMap[dateStr] ?? 0
    cells.push({
      day: d, dateStr, saved,
      hasSaved: saved > 0,
      isToday:  dateStr === todayStr,
      isFuture: dateStr > todayStr,
    })
  }
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  return (
    <div className="s5 screen-enter">
      {/* 헤더 */}
      <div className="screen-header">
        <button className="header-back" onClick={() => navigate('s4')}>← 성적표로</button>
        <span className="header-title">이번 달 절약 캘린더</span>
        <div className="header-spacer" />
      </div>

      {/* 통계 뱃지 */}
      <div className="s5-stats">
        <div className="s5-stat-item">
          <span className="s5-stat-num">{totalDays}</span>
          <span className="s5-stat-label">일 달성</span>
        </div>
        <div className="s5-stat-divider" />
        <div className="s5-stat-item">
          <span className="s5-stat-num">+{totalSaved.toLocaleString()}</span>
          <span className="s5-stat-label">원 절약</span>
        </div>
        {streak > 0 && (
          <>
            <div className="s5-stat-divider" />
            <div className="s5-stat-item">
              <span className="s5-stat-num s5-stat-streak">🔥 {streak}</span>
              <span className="s5-stat-label">일 연속</span>
            </div>
          </>
        )}
      </div>

      {/* 캘린더 */}
      <div className="s5-calendar">
        <p className="s5-month-title">{year}년 {MONTH_NAMES[month]}</p>

        {/* 요일 헤더 */}
        <div className="s5-dow-row">
          {DAY_NAMES.map((d, i) => (
            <span key={d} className={`s5-dow ${i === 0 ? 'sun' : i === 6 ? 'sat' : ''}`}>{d}</span>
          ))}
        </div>

        {/* 날짜 그리드 */}
        {weeks.map((week, wi) => (
          <div key={wi} className="s5-week-row">
            {week.map((cell, ci) => {
              if (!cell) return <div key={ci} className="s5-cell s5-cell-empty" />

              const dow = (firstDow + cell.day - 1) % 7
              let cls = 's5-cell'
              if      (cell.hasSaved)  cls += ' saved'
              else if (cell.isToday)   cls += ' today'
              else if (cell.isFuture)  cls += ' future'
              else                     cls += ' past'

              return (
                <div key={ci} className={cls}>
                  <span className={`s5-day-num ${dow === 0 ? 'sun' : dow === 6 ? 'sat' : ''}`}>
                    {cell.day}
                  </span>
                  {cell.hasSaved && (
                    <>
                      <span className="s5-check">✓</span>
                      <span className="s5-saved-amt">
                        {cell.saved >= 1000
                          ? `${(cell.saved / 1000).toFixed(1)}천`
                          : cell.saved}
                      </span>
                    </>
                  )}
                  {cell.isToday && !cell.hasSaved && (
                    <span className="s5-today-dot" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* 동기부여 메시지 */}
      <div className="s5-motivation">
        <p className="s5-motivation-text">{motivationMsg(totalDays)}</p>
        {totalDays > 0 && (
          <p className="s5-motivation-sub">
            이번 달 {totalDays}일 거지밥 달성 — 외식 대비 총 {totalSaved.toLocaleString()}원 절약
          </p>
        )}
      </div>
    </div>
  )
}
