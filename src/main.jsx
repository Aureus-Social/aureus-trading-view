import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; overflow: hidden; }
  body { background: #131722; color: #b2b5be; font-family: -apple-system, sans-serif; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #131722; }
  ::-webkit-scrollbar-thumb { background: #2a2e39; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #363c4e; }
  button { font-family: inherit; }
  input[type=number]::-webkit-inner-spin-button { opacity: 1; }
`
document.head.appendChild(style)

// Error boundary en cas de crash total
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, color: '#ef5350', fontFamily: 'JetBrains Mono, monospace', background: '#131722', minHeight: '100vh' }}>
          <div style={{ fontSize: 18, marginBottom: 16, color: '#c6a34e' }}>⚠ Aureus Trading View — Erreur de démarrage</div>
          <div style={{ fontSize: 12, color: '#787b86', marginBottom: 8 }}>{this.state.error?.message}</div>
          <button onClick={() => window.location.reload()}
            style={{ marginTop: 16, background: '#2962ff', border: 'none', borderRadius: 4, color: '#fff', padding: '8px 16px', cursor: 'pointer', fontSize: 12 }}>
            Recharger
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
