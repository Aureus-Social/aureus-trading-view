import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Global reset
const style = document.createElement('style')
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; overflow: hidden; }
  body { background: #131722; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #131722; }
  ::-webkit-scrollbar-thumb { background: #2a2e39; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #363c4e; }
  input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { opacity: 1; }
  button { font-family: inherit; }
`
document.head.appendChild(style)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
