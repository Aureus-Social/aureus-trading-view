import { useState } from 'react'
import { useAlerts } from '../store/alerts'
import { useAuth } from '../store/auth'
import { SYMBOLS } from '../store'

const CONDITIONS = [
  { value: 'above', label: 'Prix au-dessus de' },
  { value: 'below', label: 'Prix en-dessous de' },
  { value: 'cross_up', label: 'Croise à la hausse' },
  { value: 'cross_down', label: 'Croise à la baisse' },
  { value: 'ob_touch', label: 'OB touché' },
  { value: 'fvg_touch', label: 'FVG touché' },
]

const NOTIF_CHANNELS = [
  { key: 'notify_push', label: 'Push', icon: '🔔' },
  { key: 'notify_email', label: 'Email', icon: '✉️' },
  { key: 'notify_telegram', label: 'Telegram', icon: '📩' },
]

export default function AlertsPanel() {
  const { user, setAuthModal } = useAuth()
  const { alerts, localAlerts, add, remove, toggle } = useAlerts()
  const [showForm, setShowForm] = useState(false)
  const [symbol, setSymbol] = useState('XAUUSD')
  const [condition, setCondition] = useState('above')
  const [price, setPrice] = useState('')
  const [notifPush, setNotifPush] = useState(true)
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifTelegram, setNotifTelegram] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const displayAlerts = user ? alerts : localAlerts

  const selectStyle = {
    width: '100%', background: '#131722', border: '1px solid #2a2e39',
    borderRadius: 4, color: '#d1d4dc', fontSize: 11, padding: '6px 8px',
    fontFamily: 'JetBrains Mono, monospace', marginBottom: 8
  }

  const handleAdd = async () => {
    if (!user) { setAuthModal('login'); return }
    if (!price && !['ob_touch', 'fvg_touch'].includes(condition)) {
      setError('Prix requis'); return
    }
    setSaving(true); setError('')
    const result = await add({
      symbol, condition,
      price: price ? parseFloat(price) : null,
      notify_push: notifPush,
      notify_email: notifEmail,
      notify_telegram: notifTelegram,
    })
    if (result?.error) setError(result.error.message)
    else { setShowForm(false); setPrice('') }
    setSaving(false)

    // Request push permission
    if (notifPush && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  const condLabel = (c) => CONDITIONS.find(x => x.value === c)?.label || c

  return (
    <div style={{ fontFamily: 'JetBrains Mono, monospace' }}>
      {/* Header */}
      <div style={{ padding: '6px 12px 4px', fontSize: 10, color: '#787b86', textTransform: 'uppercase', letterSpacing: '.08em', borderBottom: '0.5px solid #2a2e39', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Alertes prix</span>
        <span style={{ color: '#2962ff' }}>{displayAlerts.length} actives</span>
      </div>

      {/* Alert list */}
      {displayAlerts.map(alert => (
        <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', padding: '7px 12px', borderBottom: '0.5px solid #1e222d', gap: 7 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 4,
            background: alert.triggered_at ? '#787b86' : (alert.condition === 'above' ? '#26a69a' : '#ef5350')
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#d1d4dc', fontWeight: 500 }}>{alert.symbol}</div>
            <div style={{ fontSize: 10, color: '#787b86', marginTop: 1 }}>
              {condLabel(alert.condition)}{alert.price ? ` ${alert.price.toFixed(2)}` : ''}
            </div>
            {alert.triggered_at && (
              <div style={{ fontSize: 9, color: '#f0b90b', marginTop: 1 }}>✓ Déclenché</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {!user ? null : (
              <button onClick={() => toggle(alert.id)}
                style={{ background: alert.active ? '#26a69a15' : '#2a2e39', border: 'none', borderRadius: 3, color: alert.active ? '#26a69a' : '#787b86', fontSize: 9, padding: '2px 5px', cursor: 'pointer' }}>
                {alert.active ? 'ON' : 'OFF'}
              </button>
            )}
            <button onClick={() => user ? remove(alert.id) : null}
              style={{ background: 'none', border: 'none', color: '#ef535060', cursor: 'pointer', fontSize: 14, padding: '0 2px', lineHeight: 1 }}>×</button>
          </div>
        </div>
      ))}

      {displayAlerts.length === 0 && !showForm && (
        <div style={{ padding: '10px 12px', fontSize: 11, color: '#5d606b' }}>Aucune alerte active</div>
      )}

      {/* Add form */}
      {showForm ? (
        <div style={{ padding: '10px 12px', borderTop: '0.5px solid #2a2e39' }}>
          <select value={symbol} onChange={e => setSymbol(e.target.value)} style={selectStyle}>
            {SYMBOLS.map(s => <option key={s.symbol} value={s.symbol}>{s.symbol} — {s.name}</option>)}
          </select>
          <select value={condition} onChange={e => setCondition(e.target.value)} style={selectStyle}>
            {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          {!['ob_touch', 'fvg_touch'].includes(condition) && (
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="Prix cible ex: 2350.00"
              style={{ ...selectStyle, marginBottom: 8 }}
            />
          )}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {NOTIF_CHANNELS.map(ch => (
              <label key={ch.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#b2b5be', cursor: 'pointer' }}>
                <input type="checkbox"
                  checked={ch.key === 'notify_push' ? notifPush : ch.key === 'notify_email' ? notifEmail : notifTelegram}
                  onChange={e => ch.key === 'notify_push' ? setNotifPush(e.target.checked) : ch.key === 'notify_email' ? setNotifEmail(e.target.checked) : setNotifTelegram(e.target.checked)}
                  style={{ accentColor: '#2962ff' }}
                />
                {ch.icon} {ch.label}
              </label>
            ))}
          </div>
          {error && <div style={{ fontSize: 10, color: '#ef5350', marginBottom: 6 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleAdd} disabled={saving}
              style={{ flex: 1, background: '#2962ff', border: 'none', borderRadius: 3, color: '#fff', fontSize: 11, padding: '6px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
              {saving ? '...' : '+ Créer'}
            </button>
            <button onClick={() => setShowForm(false)}
              style={{ background: '#2a2e39', border: 'none', borderRadius: 3, color: '#787b86', fontSize: 11, padding: '6px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '8px 12px' }}>
          <button onClick={() => { if (!user) setAuthModal('login'); else setShowForm(true) }}
            style={{ width: '100%', background: '#2962ff15', border: '1px solid #2962ff40', borderRadius: 4, color: '#2962ff', fontSize: 11, padding: '6px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
            + Nouvelle alerte {!user ? '(connexion requise)' : ''}
          </button>
        </div>
      )}
    </div>
  )
}
