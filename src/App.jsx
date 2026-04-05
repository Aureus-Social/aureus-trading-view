import { useState, useEffect, useCallback } from 'react'
import { useStore, SYMBOLS, TIMEFRAMES, CHART_TYPES } from './store'
import { useMarketData } from './hooks/useMarketData'
import Chart from './components/Chart'
import Settings from './components/Settings'
import RightPanel from './components/RightPanel'
import AuthModal from './components/AuthModal'
import PricingModal from './components/PricingModal'
import UserMenu from './components/UserMenu'
import { useAuth } from './store/auth'

// Icons SVG inline
const SearchIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
)

const ChartIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <rect x="1" y="8" width="3" height="4" fill="currentColor"/>
    <rect x="5" y="5" width="3" height="7" fill="currentColor"/>
    <rect x="9" y="2" width="3" height="10" fill="currentColor"/>
  </svg>
)

const SettingsIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="2" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M6.5 1v1.5M6.5 10.5V12M1 6.5h1.5M10.5 6.5H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)

const CandelIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="5" width="3" height="6" fill="#26a69a"/>
    <line x1="4.5" y1="2" x2="4.5" y2="5" stroke="#26a69a" strokeWidth="1.2"/>
    <line x1="4.5" y1="11" x2="4.5" y2="14" stroke="#26a69a" strokeWidth="1.2"/>
    <rect x="10" y="4" width="3" height="7" fill="#ef5350"/>
    <line x1="11.5" y1="1" x2="11.5" y2="4" stroke="#ef5350" strokeWidth="1.2"/>
    <line x1="11.5" y1="11" x2="11.5" y2="14" stroke="#ef5350" strokeWidth="1.2"/>
  </svg>
)

function SearchModal({ onClose }) {
  const { setSymbol, searchQuery, setSearchQuery } = useStore()
  const filtered = SYMBOLS.filter(s =>
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const categories = [...new Set(filtered.map(s => s.category))]

  const handleSelect = (sym) => {
    setSymbol(sym)
    setSearchQuery('')
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 80 }}>
      <div style={{ background: '#1a1e2d', border: '1px solid #2a2e39', borderRadius: 8, width: 480, maxHeight: 500, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: '1px solid #2a2e39' }}>
          <SearchIcon />
          <input
            autoFocus
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher symbole, ex: XAUUSD, BTC, EUR..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#d1d4dc', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#787b86', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>
          {categories.map(cat => (
            <div key={cat}>
              <div style={{ fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em', padding: '8px 14px 4px' }}>{cat}</div>
              {filtered.filter(s => s.category === cat).map(s => (
                <div key={s.symbol} onClick={() => handleSelect(s.symbol)}
                  style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', cursor: 'pointer', gap: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#2a2e39'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#d1d4dc', width: 80, fontFamily: 'JetBrains Mono, monospace' }}>{s.symbol}</span>
                  <span style={{ fontSize: 12, color: '#787b86' }}>{s.name}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const {
    symbol, timeframe, chartType, livePrice, priceChange, priceChangePct,
    setTimeframe, setChartType, showSettings, setShowSettings
  } = useStore()

  const { init: initAuth } = useAuth()
  const [showSearch, setShowSearch] = useState(false)
  const [showPricing, setShowPricing] = useState(false)

  // Init auth session
  useEffect(() => { initAuth() }, [])

  // Initialize market data & live ticks
  useMarketData()

  const symInfo = SYMBOLS.find(s => s.symbol === symbol)
  const isUp = priceChange >= 0

  const fmt = (p) => {
    if (!p) return '—'
    if (p > 10000) return p.toFixed(0)
    if (p > 1000) return p.toFixed(2)
    if (p > 100) return p.toFixed(2)
    if (p > 1) return p.toFixed(4)
    return p.toFixed(5)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#131722', color: '#b2b5be', fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden' }}>

      {/* TOP NAV */}
      <div style={{ height: 36, background: '#1e222d', borderBottom: '1px solid #2a2e39', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ width: 44, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #2a2e39' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 1L16 15H2Z" fill="#c6a34e"/>
          </svg>
        </div>

        {/* Nav items */}
        {['Chart', 'Screener', 'Heatmap', 'Alertes', 'Calendrier'].map(item => (
          <div key={item} style={{ padding: '0 12px', height: 36, display: 'flex', alignItems: 'center', fontSize: 12, color: item === 'Chart' ? '#fff' : '#787b86', cursor: 'pointer', borderRight: '1px solid #2a2e39', whiteSpace: 'nowrap' }}
            onMouseEnter={e => { if (item !== 'Chart') e.currentTarget.style.color = '#d1d4dc' }}
            onMouseLeave={e => { if (item !== 'Chart') e.currentTarget.style.color = '#787b86' }}>
            {item}
          </div>
        ))}

        {/* Search bar */}
        <div onClick={() => setShowSearch(true)}
          style={{ flex: 1, maxWidth: 280, height: 36, display: 'flex', alignItems: 'center', padding: '0 10px', borderRight: '1px solid #2a2e39', cursor: 'text', gap: 8 }}>
          <SearchIcon />
          <span style={{ fontSize: 12, color: '#5d606b' }}>Rechercher symbole...</span>
          <span style={{ fontSize: 10, color: '#363c4e', marginLeft: 'auto', fontFamily: 'JetBrains Mono, monospace' }}>Ctrl+K</span>
        </div>

        {/* Right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 10, color: '#787b86', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#26a69a' }} />
            Live · ~8ms
          </div>
          <button onClick={() => setShowPricing(true)}
            style={{ background: '#c6a34e', border: 'none', borderRadius: 4, color: '#131722', fontSize: 10, fontWeight: 700, padding: '3px 9px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
            Pro ⚡
          </button>
          <div style={{ width: 1, height: 16, background: '#2a2e39' }} />
          <UserMenu onOpenPricing={() => setShowPricing(true)} />
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ height: 38, background: '#1e222d', borderBottom: '1px solid #2a2e39', display: 'flex', alignItems: 'center', flexShrink: 0 }}>

        {/* Symbol block */}
        <div onClick={() => setShowSearch(true)}
          style={{ display: 'flex', alignItems: 'center', height: 38, padding: '0 14px', borderRight: '1px solid #2a2e39', cursor: 'pointer', gap: 10, minWidth: 200 }}
          onMouseEnter={e => e.currentTarget.style.background = '#2a2e39'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'JetBrains Mono, monospace' }}>{symbol}</span>
              <span style={{ fontSize: 10, color: '#787b86' }}>{symInfo?.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: isUp ? '#26a69a' : '#ef5350', fontFamily: 'JetBrains Mono, monospace' }}>
                {fmt(livePrice)}
              </span>
              <span style={{ fontSize: 11, color: isUp ? '#26a69a' : '#ef5350' }}>
                {isUp ? '+' : ''}{priceChange?.toFixed(2)} ({isUp ? '+' : ''}{priceChangePct?.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Timeframes */}
        <div style={{ display: 'flex', alignItems: 'center', height: 38, padding: '0 6px', borderRight: '1px solid #2a2e39', gap: 1 }}>
          {TIMEFRAMES.map(tf => (
            <button key={tf.label}
              onClick={() => setTimeframe(tf.label)}
              style={{
                padding: '4px 7px', fontSize: 11, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace',
                color: timeframe === tf.label ? '#fff' : '#787b86',
                background: timeframe === tf.label ? '#2962ff' : 'transparent',
                border: 'none', cursor: 'pointer', borderRadius: 3, height: 26
              }}>
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart types */}
        <div style={{ display: 'flex', alignItems: 'center', height: 38, padding: '0 6px', borderRight: '1px solid #2a2e39', gap: 1 }}>
          {CHART_TYPES.map(ct => (
            <button key={ct.id}
              onClick={() => setChartType(ct.id)}
              title={ct.label}
              style={{
                width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: chartType === ct.id ? '#2a2e39' : 'transparent',
                border: 'none', cursor: 'pointer', borderRadius: 3,
                color: chartType === ct.id ? '#d1d4dc' : '#787b86',
                fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
              }}>
              {ct.id === 'candlestick' && <CandelIcon />}
              {ct.id === 'heikinashi' && <span style={{ fontSize: 10 }}>HA</span>}
              {ct.id === 'bar' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="4" y1="2" x2="4" y2="12" stroke="currentColor" strokeWidth="1.5"/><line x1="4" y1="4" x2="2" y2="4" stroke="currentColor" strokeWidth="1.5"/><line x1="4" y1="8" x2="6" y2="8" stroke="currentColor" strokeWidth="1.5"/><line x1="10" y1="2" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5"/><line x1="10" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.5"/><line x1="10" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5"/></svg>}
              {ct.id === 'line' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="2,11 5,7 8,9 11,4 13,6" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>}
              {ct.id === 'area' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><polyline points="2,11 5,7 8,9 11,4 13,6 13,12 2,12" stroke="currentColor" strokeWidth="1.2" fill="rgba(255,255,255,0.15)"/></svg>}
              {ct.id === 'hollow' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="3" y="5" width="3" height="6" stroke="#26a69a" strokeWidth="1.2" fill="none"/><rect x="9" y="4" width="3" height="7" stroke="#ef5350" strokeWidth="1.2" fill="none"/></svg>}
            </button>
          ))}
        </div>

        {/* Indicators button */}
        <button
          onClick={() => setShowSettings(true)}
          style={{ display: 'flex', alignItems: 'center', height: 38, padding: '0 12px',  fontSize: 12, color: '#b2b5be', cursor: 'pointer', gap: 6, background: 'none', borderRight: '1px solid #2a2e39' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M1 9l3-4 3 3 2-5 3 3" stroke="currentColor" strokeWidth="1.3" fill="none"/></svg>
          Indicateurs
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{ marginLeft: 'auto', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: showSettings ? '#2a2e39' : 'none', border: 'none', borderLeft: '1px solid #2a2e39', color: showSettings ? '#d1d4dc' : '#787b86', cursor: 'pointer' }}>
          <SettingsIcon />
        </button>
      </div>

      {/* BODY */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Left tools */}
        <div style={{ width: 44, background: '#1e222d', borderRight: '1px solid #2a2e39', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 0', gap: 2, flexShrink: 0 }}>
          {[
            { icon: <path d="M2 11L11 2M2 2l9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>, title: 'Curseur' },
            { icon: <line x1="1" y1="6.5" x2="12" y2="6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>, title: 'Ligne horizontale' },
            { icon: <path d="M2 11L11 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>, title: 'Ligne de tendance' },
            { icon: <rect x="2" y="2" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.3"/>, title: 'Rectangle' },
            { icon: <path d="M2 11L6.5 2 11 11z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round"/>, title: 'Triangle' },
            null, // separator
            { icon: <path d="M2 10l3-4 3 3 3-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>, title: 'Fibonacci' },
            { icon: <path d="M2 9L5 5l2 3 1-2 3 3" stroke="currentColor" strokeWidth="1.3" fill="none"/>, title: 'Canal' },
            null,
            { icon: <><circle cx="6.5" cy="6.5" r="2" fill="currentColor"/><path d="M6.5 1.5v2M6.5 9.5v2M1.5 6.5h2M9.5 6.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></>, title: 'Mesure' },
            { icon: <path d="M2 11V2l4 4 3-4v9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none"/>, title: 'Texte' },
          ].map((tool, i) => {
            if (tool === null) return <div key={i} style={{ width: 28, height: 1, background: '#2a2e39', margin: '3px 0' }} />
            return (
              <button key={i} title={tool.title}
                style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3, cursor: 'pointer', color: '#787b86', background: i === 0 ? '#2a2e39' : 'transparent', border: 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = '#2a2e39'}
                onMouseLeave={e => { if (i !== 0) e.currentTarget.style.background = 'transparent' }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">{tool.icon}</svg>
              </button>
            )
          })}
        </div>

        {/* Chart area */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Chart />
        </div>

        {/* Right panel */}
        <RightPanel />

        {/* Settings overlay */}
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </div>

      {/* STATUS BAR */}
      <div style={{ height: 22, background: '#1e222d', borderTop: '1px solid #2a2e39', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 16, fontSize: 10, color: '#787b86', flexShrink: 0, fontFamily: 'JetBrains Mono, monospace' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#26a69a' }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#26a69a' }} />
          Live
        </div>
        <span>Polygon.io WebSocket</span>
        <span style={{ color: '#2196f3' }}>~8ms</span>
        <span style={{ marginLeft: 'auto' }}>Hetzner EU-WEST</span>
        <span>Powered by Lightweight Charts™ · TradingView</span>
        <span style={{ color: '#c6a34e', fontWeight: 600 }}>Aureus Trading View v1.0</span>
      </div>

      {/* Search modal */}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}

      {/* Auth modal */}
      <AuthModal />

      {/* Pricing modal */}
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} />}
    </div>
  )
}
