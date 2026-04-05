import { useState } from 'react'
import { supabase } from '../lib/supabase'
import './S8Auth.css'

export default function S8Auth({ navigate }) {
  const [mode, setMode]         = useState('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password })
        if (err) throw err
        setDone(true)
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password })
        if (err) throw err
      }
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="s8 screen-enter">
        <div className="s8-box">
          <div className="s8-done-icon">📬</div>
          <h2 className="s8-done-title">이메일을 확인해주세요</h2>
          <p className="s8-done-sub"><strong>{email}</strong>으로 인증 메일을 보냈어요.<br />링크를 클릭한 뒤 로그인해주세요.</p>
          <button className="s8-switch-btn" onClick={() => { setDone(false); setMode('login') }}>로그인하러 가기</button>
        </div>
      </div>
    )
  }

  return (
    <div className="s8 screen-enter">
      <div className="s8-box">
        <div className="s8-logo">🍚</div>
        <h1 className="s8-brand">거지밥</h1>
        <p className="s8-desc">로그인하면 식단 기록이 기기 간에 동기화돼요.</p>
        <div className="s8-tabs">
          <button className={`s8-tab ${mode==='login'?'active':''}`} onClick={() => { setMode('login'); setError('') }}>로그인</button>
          <button className={`s8-tab ${mode==='signup'?'active':''}`} onClick={() => { setMode('signup'); setError('') }}>회원가입</button>
        </div>
        <form className="s8-form" onSubmit={handleSubmit}>
          <input className="s8-input" type="email" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} required autoComplete="email" />
          <input className="s8-input" type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} autoComplete={mode==='login'?'current-password':'new-password'} />
          {error && <p className="s8-error">{error}</p>}
          <button className="s8-submit" type="submit" disabled={loading}>
            {loading ? '처리 중…' : mode==='login' ? '로그인' : '회원가입'}
          </button>
        </form>
        <button className="s8-skip-btn" onClick={() => navigate('s0')}>로그인 없이 계속하기 →</button>
      </div>
    </div>
  )
}

function translateError(msg) {
  if (msg.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 맞지 않아요.'
  if (msg.includes('Email not confirmed'))       return '이메일 인증이 필요해요.'
  if (msg.includes('User already registered'))   return '이미 가입된 이메일이에요.'
  if (msg.includes('Password should be'))        return '비밀번호는 6자 이상이어야 해요.'
  return msg
}
