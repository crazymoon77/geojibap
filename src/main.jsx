import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './App.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight:'100vh', background:'#111', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'sans-serif', color:'#fff', padding:'24px', textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🍚</div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>거지밥</div>
          <div style={{ fontSize:13, color:'#888', marginBottom:24 }}>잠시 문제가 발생했어요. 새로고침해주세요.</div>
          <button onClick={() => window.location.reload()} style={{ background:'#2eb86b', border:'none', borderRadius:10, padding:'12px 24px', fontSize:14, fontWeight:700, color:'#fff', cursor:'pointer' }}>새로고침</button>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
