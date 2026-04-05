import { useState, useEffect, useRef } from 'react'
import { useStore, SYMBOLS } from '../store'
import { calcEMA, calcRSI, calcMACD, calcBollingerBands, detectOrderBlocks, generateMockCandles } from '../lib/indicators'

const CONDITIONS = [
  { id: 'rsi_ob',    label: 'RSI > 70 (Surachat)',     category: 'oscillateur' },
  { id: 'rsi_os',    label: 'RSI < 30 (Survente)',      category: 'oscillateur' },
  { id: 'rsi_mid',   label: 'RSI > 50 (Bullish)',       category: 'oscillateur' },
  { id: 'macd_bull', label: 'MACD croise Signal ↑',     category: 'momentum' },
  { id: 'macd_bear', label: 'MACD croise Signal ↓',     category: 'momentum' },
  { id: 'ema_bull',  label: 'Prix > EMA 200',           category: 'tendance' },
  { id: 'ema_bear',  label: 'Prix < EMA 200',           category: 'tendance' },
  { id: 'ema_cross', label: 'EMA 20 croise EMA 50 ↑',  category: 'tendance' },
  { id: 'bb_upper',  label: 'Prix touche BB Sup',       category: 'volatilité' },
  { id: 'bb_lower',  label: 'Prix touche BB Inf',       category: 'volatilité' },
  { id: 'ob_bull',   label: 'OB Bullish intact',        category: 'SMC' },
  { id: 'ob_bear',   label: 'OB Bearish intact',        category: 'SMC' },
  { id: 'vol_spike', label: 'Volume spike > 2x',        category: 'volume' },
  { id: 'new_high',  label: 'Plus haut 20 périodes',    category: 'structure' },
  { id: 'new_low',   label: 'Plus bas 20 périodes',     category: 'structure' },
]

function analyzeSymbol(symbol) {
  const sym = SYMBOLS.find(s => s.symbol === symbol)
  const candles = generateMockCandles(100, sym?.base || 100, symbol)
  const prices = candles.map(c => c.close)
  const volumes = candles.map(c => c.volume)
  const last = candles[candles.length - 1]
  const prev = candles[candles.length - 2]

  const rsi = calcRSI(prices, 14)
  const lastRSI = rsi[rsi.length - 1]
  const ema20 = calcEMA(prices, 20)
  const ema50 = calcEMA(prices, 50)
  const ema200 = calcEMA(prices, 200)
  const { macdLine, signalLine } = calcMACD(prices, 12, 26, 9)
  const bb = calcBollingerBands(prices, 20, 2)
  const lastBB = bb[bb.length - 1]
  const obs = detectOrderBlocks(candles)
  const avgVol = volumes.slice(-20).reduce((a,b) => a+b, 0) / 20

  const change = ((last.close - candles[0].close) / candles[0].close) * 100
  const high20 = Math.max(...candles.slice(-20).map(c => c.high))
  const low20 = Math.min(...candles.slice(-20).map(c => c.low))

  const matched = []
  if (lastRSI > 70) matched.push('rsi_ob')
  if (lastRSI < 30) matched.push('rsi_os')
  if (lastRSI > 50) matched.push('rsi_mid')
  if (macdLine[macdLine.length-1] > signalLine[signalLine.length-1] &&
      macdLine[macdLine.length-2] <= signalLine[signalLine.length-2]) matched.push('macd_bull')
  if (macdLine[macdLine.length-1] < signalLine[signalLine.length-1] &&
      macdLine[macdLine.length-2] >= signalLine[signalLine.length-2]) matched.push('macd_bear')
  if (last.close > ema200[ema200.length-1]) matched.push('ema_bull')
  if (last.close < ema200[ema200.length-1]) matched.push('ema_bear')
  if (ema20[ema20.length-1] > ema50[ema50.length-1] &&
      ema20[ema20.length-2] <= ema50[ema50.length-2]) matched.push('ema_cross')
  if (lastBB?.upper && last.close >= lastBB.upper * 0.998) matched.push('bb_upper')
  if (lastBB?.lower && last.close <= lastBB.lower * 1.002) matched.push('bb_lower')
  if (obs.some(ob => ob.type === 'bull' && ob.intact)) matched.push('ob_bull')
  if (obs.some(ob => ob.type === 'bear' && ob.intact)) matched.push('ob_bear')
  if (last.volume > avgVol * 2) matched.push('vol_spike')
  if (last.high >= high20) matched.push('new_high')
  if (last.low <= low20) matched.push('new_low')

  return {
    symbol,
    name: sym?.name || symbol,
    price: last.close,
    change,
    rsi: lastRSI,
    volume: last.volume,
    matched,
    trend: last.close > ema200[ema200.length-1] ? 'bull' : 'bear',
  }
}

const catColors = { oscillateur: '#2196f3', momentum: '#ff9800', tendance: '#26a69a', volatilité: '#9c27b0', SMC: '#c6a34e', volume: '#00bcd4', structure: '#e91e63' }

export default function Screener({ onClose }) {
  const { setSymbol } = useStore()
  const [activeConditions, setActiveConditions] = useState(['rsi_os', 'ob_bull'])
  const [results, setResults] = useState([])
  const [scanning, setScanning] = useState(false)
  const [sortBy, setSortBy] = useState('matches')
  const [filterCat, setFilterCat] = useState('all')
  const scanRef = useRef(null)

  const toggleCondition = (id) => {
    setActiveConditions(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const runScan = () => {
    setScanning(true)
    setResults([])
    let i = 0
    const symbols = SYMBOLS.map(s => s.symbol)
    scanRef.current = setInterval(() => {
      if (i >= symbols.length) {
        clearInterval(scanRef.current)
        setScanning(false)
        return
      }
      const result = analyzeSymbol(symbols[i])
      if (activeConditions.length === 0 || activeConditions.some(c => result.matched.includes(c))) {
        setResults(prev => [...prev, result])
      }
      i++
    }, 60)
  }

  useEffect(() => () => clearInterval(scanRef.current), [])

  const sorted = [...results].sort((a, b) => {
    if (sortBy === 'matches') return b.matched.length - a.matched.length
    if (sortBy === 'rsi_asc') return a.rsi - b.rsi
    if (sortBy === 'rsi_desc') return b.rsi - a.rsi
    if (sortBy === 'change') return Math.abs(b.change) - Math.abs(a.change)
    return 0
  })

  const categories = [...new Set(CONDITIONS.map(c => c.category))]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ background: '#1a1e2d', border: '1px solid #2a2e39', borderRadius: 10, width: '100%', maxWidth: 980, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2e39', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Screener multi-actifs</div>
            <div style={{ fontSize: 11, color: '#787b86', marginTop: 2 }}>Scanner {SYMBOLS.length} instruments selon vos conditions</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#787b86', cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left — conditions */}
          <div style={{ width: 260, borderRight: '1px solid #2a2e39', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #2a2e39', fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              Conditions ({activeConditions.length} actives)
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
              {categories.map(cat => (
                <div key={cat}>
                  <div style={{ fontSize: 9, color: catColors[cat] || '#787b86', textTransform: 'uppercase', letterSpacing: '.1em', padding: '6px 14px 3px', fontWeight: 700 }}>{cat}</div>
                  {CONDITIONS.filter(c => c.category === cat).map(cond => (
                    <div key={cond.id}
                      onClick={() => toggleCondition(cond.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', cursor: 'pointer', background: activeConditions.includes(cond.id) ? `${catColors[cat]}15` : 'transparent' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#2a2e39'}
                      onMouseLeave={e => e.currentTarget.style.background = activeConditions.includes(cond.id) ? `${catColors[cat]}15` : 'transparent'}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${activeConditions.includes(cond.id) ? catColors[cat] : '#363c4e'}`, background: activeConditions.includes(cond.id) ? catColors[cat] : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {activeConditions.includes(cond.id) && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 11, color: activeConditions.includes(cond.id) ? '#d1d4dc' : '#787b86' }}>{cond.label}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ padding: 12, borderTop: '1px solid #2a2e39', flexShrink: 0 }}>
              <button onClick={runScan} disabled={scanning}
                style={{ width: '100%', background: scanning ? '#2a2e39' : '#2962ff', border: 'none', borderRadius: 5, color: scanning ? '#787b86' : '#fff', fontSize: 12, fontWeight: 700, padding: '9px', cursor: scanning ? 'default' : 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                {scanning ? `Scanning... ${results.length}/${SYMBOLS.length}` : '▶ Lancer le scan'}
              </button>
            </div>
          </div>

          {/* Right — results */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '8px 14px', borderBottom: '1px solid #2a2e39', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: '#787b86' }}>{sorted.length} résultats</span>
              <span style={{ fontSize: 10, color: '#5d606b' }}>Trier par :</span>
              {[['matches', 'Matchs'], ['rsi_asc', 'RSI ↑'], ['rsi_desc', 'RSI ↓'], ['change', '% Variation']].map(([val, lbl]) => (
                <button key={val} onClick={() => setSortBy(val)}
                  style={{ background: sortBy === val ? '#2962ff20' : 'transparent', border: `1px solid ${sortBy === val ? '#2962ff' : '#2a2e39'}`, borderRadius: 4, color: sortBy === val ? '#2962ff' : '#787b86', fontSize: 10, padding: '2px 8px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                  {lbl}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
              {results.length === 0 && !scanning && (
                <div style={{ padding: 30, textAlign: 'center', color: '#5d606b', fontSize: 12 }}>
                  Sélectionne des conditions et lance le scan ▶
                </div>
              )}
              {sorted.map(r => (
                <div key={r.symbol}
                  onClick={() => { setSymbol(r.symbol); onClose() }}
                  style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '0.5px solid #1e222d', cursor: 'pointer', gap: 12 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e222d'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 70 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#d1d4dc' }}>{r.symbol}</div>
                    <div style={{ fontSize: 9, color: '#5d606b' }}>{r.name.split('/')[0]}</div>
                  </div>
                  <div style={{ width: 80, textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: r.change >= 0 ? '#26a69a' : '#ef5350' }}>
                      {r.price > 1000 ? r.price.toFixed(2) : r.price.toFixed(4)}
                    </div>
                    <div style={{ fontSize: 10, color: r.change >= 0 ? '#26a69a' : '#ef5350' }}>
                      {r.change >= 0 ? '+' : ''}{r.change.toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ width: 50 }}>
                    <div style={{ fontSize: 10, color: '#787b86' }}>RSI</div>
                    <div style={{ fontSize: 12, color: r.rsi > 70 ? '#ef5350' : r.rsi < 30 ? '#26a69a' : '#d1d4dc', fontWeight: 600 }}>
                      {r.rsi.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ width: 30 }}>
                    <div style={{ fontSize: 9, color: r.trend === 'bull' ? '#26a69a' : '#ef5350', fontWeight: 700 }}>
                      {r.trend === 'bull' ? '▲ BULL' : '▼ BEAR'}
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {r.matched.map(m => {
                      const cond = CONDITIONS.find(c => c.id === m)
                      return (
                        <span key={m} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${catColors[cond?.category] || '#787b86'}20`, color: catColors[cond?.category] || '#787b86', whiteSpace: 'nowrap' }}>
                          {cond?.label || m}
                        </span>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: 10, color: '#2962ff', whiteSpace: 'nowrap' }}>{r.matched.length} match →</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
