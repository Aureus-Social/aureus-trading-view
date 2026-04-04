import { useState } from 'react'
import { useStore, SYMBOLS } from '../store'

const INDICATOR_TYPES = ['EMA', 'SMA', 'WMA']

function ColorPicker({ label, colorKey }) {
  const { colors, setColor } = useStore()
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid #2a2e39' }}>
      <span style={{ fontSize: 11, color: '#b2b5be' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 20, height: 20, borderRadius: 3, background: colors[colorKey], border: '1px solid #363c4e' }} />
        <input
          type="color"
          value={colors[colorKey]}
          onChange={e => setColor(colorKey, e.target.value)}
          style={{ width: 28, height: 22, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
        />
      </div>
    </div>
  )
}

function IndicatorRow({ ind }) {
  const { updateIndicator, removeIndicator } = useStore()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '0.5px solid #2a2e39' }}>
      <div style={{ width: 10, height: 10, borderRadius: 2, background: ind.color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: '#d1d4dc', width: 40 }}>{ind.type}</span>
      <input
        type="number"
        value={ind.period}
        min={1} max={500}
        onChange={e => updateIndicator(ind.id, { period: parseInt(e.target.value) || 1 })}
        style={{ width: 44, background: '#1e222d', border: '1px solid #363c4e', borderRadius: 3, color: '#d1d4dc', fontSize: 11, padding: '2px 4px', fontFamily: 'JetBrains Mono, monospace' }}
      />
      <input
        type="color"
        value={ind.color}
        onChange={e => updateIndicator(ind.id, { color: e.target.value })}
        style={{ width: 24, height: 20, padding: 0, border: 'none', background: 'none', cursor: 'pointer', flexShrink: 0 }}
      />
      <select
        value={ind.width || 1.5}
        onChange={e => updateIndicator(ind.id, { width: parseFloat(e.target.value) })}
        style={{ background: '#1e222d', border: '1px solid #363c4e', borderRadius: 3, color: '#d1d4dc', fontSize: 10, padding: '2px 2px', fontFamily: 'JetBrains Mono, monospace', width: 32 }}
      >
        {[1, 1.5, 2, 2.5, 3].map(w => <option key={w} value={w}>{w}px</option>)}
      </select>
      <button
        onClick={() => updateIndicator(ind.id, { visible: !ind.visible })}
        style={{ background: ind.visible ? '#26a69a20' : '#2a2e39', border: 'none', borderRadius: 3, color: ind.visible ? '#26a69a' : '#787b86', fontSize: 10, padding: '2px 5px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}
      >
        {ind.visible ? 'ON' : 'OFF'}
      </button>
      <button
        onClick={() => removeIndicator(ind.id)}
        style={{ background: 'none', border: 'none', color: '#ef5350', cursor: 'pointer', fontSize: 13, padding: '0 3px', marginLeft: 'auto' }}
      >×</button>
    </div>
  )
}

export default function Settings({ onClose }) {
  const { indicators, addIndicator, showRSI, showMACD, showVolume, showBB, showOB, showFVG, showVWAP, toggleIndicator } = useStore()
  const [newType, setNewType] = useState('EMA')
  const [newPeriod, setNewPeriod] = useState(21)
  const [newColor, setNewColor] = useState('#ffffff')
  const [tab, setTab] = useState('colors')

  const handleAddIndicator = () => {
    addIndicator({ type: newType, period: newPeriod, color: newColor, width: 1.5, visible: true })
  }

  const overlays = [
    { key: 'showBB', label: 'Bollinger Bands (20,2)', val: showBB },
    { key: 'showVWAP', label: 'VWAP', val: showVWAP },
    { key: 'showOB', label: 'Order Blocks (SMC)', val: showOB },
    { key: 'showFVG', label: 'Fair Value Gaps (SMC)', val: showFVG },
  ]

  const panels = [
    { key: 'showRSI', label: 'RSI (14)', val: showRSI },
    { key: 'showMACD', label: 'MACD (12,26,9)', val: showMACD },
    { key: 'showVolume', label: 'Volume', val: showVolume },
  ]

  const tabStyle = (t) => ({
    padding: '6px 12px', fontSize: 11, cursor: 'pointer', border: 'none',
    background: tab === t ? '#2962ff' : 'transparent',
    color: tab === t ? '#fff' : '#787b86',
    borderRadius: 4, fontFamily: 'JetBrains Mono, monospace'
  })

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, width: 300, height: '100%', background: '#1a1e2d', borderLeft: '1px solid #2a2e39', zIndex: 100, display: 'flex', flexDirection: 'column', fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid #2a2e39' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#d1d4dc' }}>Paramètres</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#787b86', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, padding: '8px 10px', borderBottom: '1px solid #2a2e39' }}>
        <button style={tabStyle('colors')} onClick={() => setTab('colors')}>Couleurs</button>
        <button style={tabStyle('indicators')} onClick={() => setTab('indicators')}>Indicateurs</button>
        <button style={tabStyle('panels')} onClick={() => setTab('panels')}>Panneaux</button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 14px' }}>
        {tab === 'colors' && (
          <>
            <div style={{ fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Bougies</div>
            <ColorPicker label="Bougie haussière" colorKey="upCandle" />
            <ColorPicker label="Bougie baissière" colorKey="downCandle" />
            <ColorPicker label="Mèche haussière" colorKey="upWick" />
            <ColorPicker label="Mèche baissière" colorKey="downWick" />
            <div style={{ fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 12, marginBottom: 8 }}>Chart</div>
            <ColorPicker label="Fond du chart" colorKey="background" />
            <ColorPicker label="Grille" colorKey="grid" />
            <ColorPicker label="Réticule" colorKey="crosshair" />
            <ColorPicker label="Texte axes" colorKey="text" />
          </>
        )}

        {tab === 'indicators' && (
          <>
            <div style={{ fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Moyennes mobiles actives</div>
            {indicators.map(ind => <IndicatorRow key={ind.id} ind={ind} />)}

            <div style={{ marginTop: 12, padding: '10px 0', borderTop: '1px solid #2a2e39' }}>
              <div style={{ fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Ajouter une MA</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                <select value={newType} onChange={e => setNewType(e.target.value)}
                  style={{ background: '#1e222d', border: '1px solid #363c4e', borderRadius: 3, color: '#d1d4dc', fontSize: 11, padding: '4px 6px', fontFamily: 'JetBrains Mono, monospace' }}>
                  {INDICATOR_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <input type="number" value={newPeriod} min={1} max={500}
                  onChange={e => setNewPeriod(parseInt(e.target.value) || 1)}
                  placeholder="Période"
                  style={{ width: 60, background: '#1e222d', border: '1px solid #363c4e', borderRadius: 3, color: '#d1d4dc', fontSize: 11, padding: '4px 6px', fontFamily: 'JetBrains Mono, monospace' }}
                />
                <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)}
                  style={{ width: 32, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                />
                <button onClick={handleAddIndicator}
                  style={{ background: '#2962ff', border: 'none', borderRadius: 3, color: '#fff', fontSize: 11, padding: '4px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                  + Ajouter
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12, borderTop: '1px solid #2a2e39', paddingTop: 10 }}>
              <div style={{ fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Overlays</div>
              {overlays.map(o => (
                <div key={o.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid #2a2e39' }}>
                  <span style={{ fontSize: 11, color: '#b2b5be' }}>{o.label}</span>
                  <button onClick={() => toggleIndicator(o.key)}
                    style={{ background: o.val ? '#26a69a20' : '#2a2e39', border: 'none', borderRadius: 3, color: o.val ? '#26a69a' : '#787b86', fontSize: 10, padding: '2px 8px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                    {o.val ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'panels' && (
          <>
            <div style={{ fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Panneaux sous le chart</div>
            {panels.map(p => (
              <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #2a2e39' }}>
                <span style={{ fontSize: 11, color: '#b2b5be' }}>{p.label}</span>
                <button onClick={() => toggleIndicator(p.key)}
                  style={{ background: p.val ? '#26a69a20' : '#2a2e39', border: 'none', borderRadius: 3, color: p.val ? '#26a69a' : '#787b86', fontSize: 10, padding: '2px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                  {p.val ? 'ON' : 'OFF'}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
