import { useStore, SYMBOLS } from '../store'
import { detectOrderBlocks, detectFVG } from '../lib/indicators'

function WatchlistItem({ symbol }) {
  const { setSymbol, symbol: active, watchlistPrices } = useStore()
  const info = SYMBOLS.find(s => s.symbol === symbol)
  const priceData = watchlistPrices[symbol]
  const price = priceData?.price
  const change = priceData?.change || 0
  const isActive = symbol === active

  const fmt = (p) => {
    if (!p) return '—'
    if (p > 1000) return p.toFixed(2)
    if (p > 100) return p.toFixed(2)
    if (p > 1) return p.toFixed(4)
    return p.toFixed(5)
  }

  return (
    <div
      onClick={() => setSymbol(symbol)}
      style={{
        display: 'flex', alignItems: 'center', padding: '7px 12px',
        cursor: 'pointer', borderBottom: '0.5px solid #1e222d',
        background: isActive ? '#1e2a3a' : 'transparent',
        gap: 8,
        transition: 'background .1s',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? '#fff' : '#d1d4dc', fontFamily: 'JetBrains Mono, monospace' }}>{symbol}</div>
        <div style={{ fontSize: 10, color: '#787b86' }}>{info?.name}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: change >= 0 ? '#26a69a' : '#ef5350', fontFamily: 'JetBrains Mono, monospace' }}>
          {fmt(price)}
        </div>
        <div style={{ fontSize: 10, color: change >= 0 ? '#26a69a' : '#ef5350' }}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

function OBItem({ ob }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '6px 12px', borderBottom: '0.5px solid #1e222d', gap: 8 }}>
      <div style={{
        width: 6, height: 6, borderRadius: 2, flexShrink: 0, marginTop: 3,
        background: ob.type === 'bull' ? '#26a69a' : '#ef5350'
      }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#d1d4dc', fontFamily: 'JetBrains Mono, monospace' }}>
          {ob.low.toFixed(2)} – {ob.high.toFixed(2)}
        </div>
        <div style={{ fontSize: 10, color: '#787b86' }}>
          {ob.type === 'bull' ? 'Bullish OB' : 'Bearish OB'} · {ob.intact ? 'Intact' : 'Mitigé'}
        </div>
      </div>
      <div style={{
        fontSize: 9, padding: '1px 5px', borderRadius: 3,
        background: ob.intact ? (ob.type === 'bull' ? '#26a69a20' : '#ef535020') : '#2a2e39',
        color: ob.intact ? (ob.type === 'bull' ? '#26a69a' : '#ef5350') : '#787b86'
      }}>
        {ob.intact ? '●' : '○'}
      </div>
    </div>
  )
}

export default function RightPanel() {
  const { activePanel, setActivePanel, watchlist, candles } = useStore()

  const obs = candles.length > 20 ? detectOrderBlocks(candles) : []
  const fvgs = candles.length > 5 ? detectFVG(candles) : []

  const tabStyle = (t) => ({
    flex: 1, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, color: activePanel === t ? '#d1d4dc' : '#787b86',
    cursor: 'pointer', border: 'none', background: 'none',
    borderBottom: activePanel === t ? '2px solid #2962ff' : '2px solid transparent',
    fontFamily: 'JetBrains Mono, monospace',
  })

  const sectionTitle = (title) => (
    <div style={{ fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em', padding: '6px 12px 4px', borderBottom: '0.5px solid #2a2e39' }}>
      {title}
    </div>
  )

  return (
    <div style={{ width: 210, background: '#131722', borderLeft: '1px solid #2a2e39', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #2a2e39', flexShrink: 0 }}>
        <button style={tabStyle('watchlist')} onClick={() => setActivePanel('watchlist')}>Marché</button>
        <button style={tabStyle('ob')} onClick={() => setActivePanel('ob')}>SMC</button>
        <button style={tabStyle('alerts')} onClick={() => setActivePanel('alerts')}>Alertes</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activePanel === 'watchlist' && (
          <>
            {sectionTitle('Favoris')}
            {watchlist.map(sym => <WatchlistItem key={sym} symbol={sym} />)}
          </>
        )}

        {activePanel === 'ob' && (
          <>
            {sectionTitle('Order Blocks')}
            {obs.length === 0 && (
              <div style={{ padding: '12px', fontSize: 11, color: '#787b86' }}>Pas assez de données</div>
            )}
            {obs.map((ob, i) => <OBItem key={i} ob={ob} />)}

            {sectionTitle('Fair Value Gaps')}
            {fvgs.map((fvg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', padding: '6px 12px', borderBottom: '0.5px solid #1e222d', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: 50, flexShrink: 0, marginTop: 3, background: fvg.type === 'bull' ? '#00bcd4' : '#ff5722' }} />
                <div>
                  <div style={{ fontSize: 11, color: '#d1d4dc', fontFamily: 'JetBrains Mono, monospace' }}>
                    {fvg.bottom.toFixed(2)} – {fvg.top.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 10, color: '#787b86' }}>FVG {fvg.type === 'bull' ? 'Bull' : 'Bear'}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {activePanel === 'alerts' && (
          <>
            {sectionTitle('Alertes actives')}
            {[
              { sym: 'XAUUSD', cond: '> 2 350', color: '#f0b90b' },
              { sym: 'BTC', cond: '< 65 000', color: '#ef5350' },
              { sym: 'EUR/USD', cond: 'OB Bull touché', color: '#26a69a' },
            ].map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderBottom: '0.5px solid #1e222d' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 11, color: '#d1d4dc', fontFamily: 'JetBrains Mono, monospace' }}>{a.sym}</div>
                  <div style={{ fontSize: 10, color: '#787b86' }}>{a.cond}</div>
                </div>
              </div>
            ))}
            <div style={{ padding: '10px 12px' }}>
              <button style={{ width: '100%', background: '#2962ff20', border: '1px solid #2962ff40', borderRadius: 4, color: '#2962ff', fontSize: 11, padding: '6px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                + Nouvelle alerte
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
