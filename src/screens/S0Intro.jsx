import './S0Intro.css'

export default function S0Intro({ navigate, hasPlan }) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: '거지밥', text: '고물가 시대, 하루 1만원으로 건강하게!', url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 복사됐습니다!')
    }
  }

  return (
    <div className="s0 screen-enter">
      {/* 앰블럼 */}
      <div className="s0-hero">
        <div className="s0-emblem">🍚</div>
        <h1 className="s0-brand">거지밥</h1>
        <div className="s0-brand-line" />
      </div>

      {/* 핵심 카피 */}
      <div className="s0-copy">
        <p className="s0-copy-headline">고물가 시대,</p>
        <p className="s0-copy-sub">그럼에도 하루하루 살아내는 우리.</p>
        <div className="s0-copy-divider" />
        <p className="s0-copy-body">건강은 지키고, 지갑도 지키는</p>
        <p className="s0-copy-body bold">오늘 하루의 밥상 전략.</p>
      </div>

      {/* 3가지 약속 */}
      <div className="s0-card">
        {[
          { icon: '💰', title: '예산 설정',   desc: '하루 예산으로 1~3끼 식단 자동 설계' },
          { icon: '🥗', title: '영양 계산',   desc: '칼로리·단백질 자동 검증' },
          { icon: '🏆', title: '절약 성취감', desc: '외식 대비 아낀 금액으로 매일 동기부여' },
        ].map((item) => (
          <div key={item.title} className="s0-card-row">
            <div className="s0-card-icon">{item.icon}</div>
            <div className="s0-card-text">
              <span className="s0-card-title">{item.title}</span>
              <span className="s0-card-desc">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 다짐 문구 */}
      <div className="s0-vow">
        <p className="s0-vow-quote">"오늘부터 나는 현명하게 먹는다."</p>
        <p className="s0-vow-author">— 거지밥 사용자 선언</p>
      </div>

      {/* CTA */}
      <div className="s0-actions">
        {hasPlan && (
          <button className="s0-resume-btn" onClick={() => navigate('s2')}>
            오늘 식단 이어서 보기 →
          </button>
        )}
        <button className="btn-primary s0-start-btn" onClick={() => navigate('s1')}>
          {hasPlan ? '새 식단 만들기' : '지금 바로 시작하기 →'}
        </button>
        <button className="s0-share-btn" onClick={handleShare}>
          📤 친구에게 거지밥 알리기
        </button>
      </div>
    </div>
  )
}
