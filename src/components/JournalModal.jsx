import { useState } from 'react'
import { useJournal, TRADE_SETUPS, TRADE_DIRECTIONS, TRADE_EMOTIONS } from '../store/journal'
import { useStore, SYMBOLS } from '../store'

const C = { bg: '#131722', bg2: '#1a1e2d', border: '#2a2e39', text: '#d1d4dc', muted: '#787b86', green: '#26a69a', red: '#ef5350', gold: '#c6a34e', blue: '#2962ff' }
const mono = 'JetBrains Mono, monospace'

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
      <div style={{ fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 5, fontFamily: mono }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: color || C.text, fontFamily: mono }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ height: 4, background: '#2a2e39', borderRadius: 2, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
    </div>
  )
}

function TradeForm({ onClose, editTrade }) {
  const { addTrade, updateTrade } = useJournal()
  const { symbol } = useStore()
  const [form, setForm] = useState(editTrade || {
    symbol, direction: 'long', setup: 'OB Bullish',
    entry: '', sl: '', tp1: '', tp2: '',
    lots: '0.1', emotion: 'confiant', notes: '', rr: '',
  })
  const [saving, setSaving] = useState(false)

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const inp = { background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontSize: 12, padding: '7px 10px', fontFamily: mono, width: '100%', outline: 'none' }
  const lbl = { fontSize: 10, color: C.muted, display: 'block', marginBottom: 4, fontFamily: mono }

  const calcRR = () => {
    const e = parseFloat(form.entry), sl = parseFloat(form.sl), tp1 = parseFloat(form.tp1)
    if (!e || !sl || !tp1) return ''
    const risk = Math.abs(e - sl), reward = Math.abs(tp1 - e)
    return risk > 0 ? (reward / risk).toFixed(2) : ''
  }

  const handleSave = async () => {
    setSaving(true)
    const rr = calcRR()
    if (editTrade) await updateTrade(editTrade.id, { ...form, rr: parseFloat(rr) || 0 })
    else await addTrade({ ...form, rr: parseFloat(rr) || 0, entry: parseFloat(form.entry), sl: parseFloat(form.sl), tp1: parseFloat(form.tp1), tp2: parseFloat(form.tp2), lots: parseFloat(form.lots), status: 'open' })
    setSaving(false)
    onClose()
  }

  const rr = calcRR()

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono }}>
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 10, width: 520, maxHeight: '88vh', overflow: 'auto' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{editTrade ? 'Modifier trade' : 'Nouveau trade'}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Symbole</label>
              <select value={form.symbol} onChange={e => f('symbol', e.target.value)} style={inp}>
                {SYMBOLS.map(s => <option key={s.symbol}>{s.symbol}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Direction</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {TRADE_DIRECTIONS.map(d => (
                  <button key={d} onClick={() => f('direction', d)}
                    style={{ flex: 1, padding: '7px', border: `1px solid ${form.direction === d ? (d === 'long' ? C.green : C.red) : C.border}`, borderRadius: 4, background: form.direction === d ? (d === 'long' ? '#26a69a20' : '#ef535020') : 'transparent', color: form.direction === d ? (d === 'long' ? C.green : C.red) : C.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: mono, textTransform: 'uppercase' }}>
                    {d === 'long' ? '▲ LONG' : '▼ SHORT'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={lbl}>Setup</label>
            <select value={form.setup} onChange={e => f('setup', e.target.value)} style={inp}>
              {TRADE_SETUPS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Entrée</label>
              <input type="number" value={form.entry} onChange={e => f('entry', e.target.value)} style={inp} placeholder="ex: 2318.50" />
            </div>
            <div>
              <label style={lbl}>Stop Loss</label>
              <input type="number" value={form.sl} onChange={e => f('sl', e.target.value)} style={inp} placeholder="ex: 2312.00" />
            </div>
            <div>
              <label style={lbl}>TP1</label>
              <input type="number" value={form.tp1} onChange={e => f('tp1', e.target.value)} style={inp} placeholder="ex: 2338.00" />
            </div>
            <div>
              <label style={lbl}>TP2</label>
              <input type="number" value={form.tp2} onChange={e => f('tp2', e.target.value)} style={inp} placeholder="ex: 2355.00" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Taille (lots)</label>
              <input type="number" value={form.lots} onChange={e => f('lots', e.target.value)} style={inp} step="0.01" />
            </div>
            <div>
              <label style={lbl}>R:R calculé</label>
              <div style={{ ...inp, color: rr ? (parseFloat(rr) >= 2 ? C.green : parseFloat(rr) >= 1 ? C.gold : C.red) : C.muted, display: 'flex', alignItems: 'center' }}>
                {rr ? `${rr} : 1` : '— (saisir entrée/SL/TP1)'}
              </div>
            </div>
          </div>

          <div>
            <label style={lbl}>État émotionnel</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {TRADE_EMOTIONS.map(e => (
                <button key={e} onClick={() => f('emotion', e)}
                  style={{ padding: '4px 10px', border: `1px solid ${form.emotion === e ? C.blue : C.border}`, borderRadius: 10, background: form.emotion === e ? '#2962ff20' : 'transparent', color: form.emotion === e ? C.blue : C.muted, fontSize: 11, cursor: 'pointer', fontFamily: mono }}>
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>Notes</label>
            <textarea value={form.notes} onChange={e => f('notes', e.target.value)} rows={3} placeholder="Contexte, raison d'entrée, ce que tu as bien/mal fait..."
              style={{ ...inp, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
            <button onClick={handleSave} disabled={saving || !form.entry}
              style={{ flex: 1, background: C.blue, border: 'none', borderRadius: 5, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px', cursor: 'pointer', fontFamily: mono, opacity: saving || !form.entry ? 0.6 : 1 }}>
              {saving ? 'Enregistrement...' : editTrade ? 'Mettre à jour' : 'Ajouter le trade'}
            </button>
            <button onClick={onClose} style={{ padding: '10px 16px', background: '#2a2e39', border: 'none', borderRadius: 5, color: C.muted, fontSize: 13, cursor: 'pointer', fontFamily: mono }}>
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function JournalModal({ onClose }) {
  const { trades, filter, setFilter, sortBy, setSortBy, closeTrade, deleteTrade, getStats } = useJournal()
  const [tab, setTab] = useState('trades') // trades | stats | psychology
  const [showForm, setShowForm] = useState(false)
  const [editTrade, setEditTrade] = useState(null)
  const [closeId, setCloseId] = useState(null)
  const [closePrice, setClosePrice] = useState('')

  const stats = getStats()

  const filtered = trades.filter(t => {
    if (filter === 'open') return t.status === 'open'
    if (filter === 'closed') return t.status === 'closed'
    if (filter === 'long') return t.direction === 'long'
    if (filter === 'short') return t.direction === 'short'
    return true
  }).sort((a, b) => {
    if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date)
    if (sortBy === 'pnl_desc') return (b.pnl || 0) - (a.pnl || 0)
    if (sortBy === 'rr_desc') return (b.rr || 0) - (a.rr || 0)
    return 0
  })

  const tabBtn = (id, label) => (
    <button onClick={() => setTab(id)}
      style={{ padding: '6px 14px', fontSize: 11, fontWeight: 500, border: 'none', background: tab === id ? C.blue : 'transparent', color: tab === id ? '#fff' : C.muted, borderRadius: 4, cursor: 'pointer', fontFamily: mono }}>
      {label}
    </button>
  )

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: mono }}>
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, width: '100%', maxWidth: 1050, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: C.bg2 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Journal de Trading</span>
          <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
            {tabBtn('trades', `Trades (${trades.length})`)}
            {tabBtn('stats', 'Statistiques')}
            {tabBtn('psychology', 'Psychologie')}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={() => { setEditTrade(null); setShowForm(true) }}
              style={{ background: C.blue, border: 'none', borderRadius: 5, color: '#fff', fontSize: 11, fontWeight: 700, padding: '6px 14px', cursor: 'pointer', fontFamily: mono }}>
              + Nouveau trade
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 22 }}>×</button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

          {/* TRADES TAB */}
          {tab === 'trades' && (
            <>
              <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
                {[['all','Tous'],['open','Ouverts'],['closed','Fermés'],['long','Long'],['short','Short']].map(([v,l]) => (
                  <button key={v} onClick={() => setFilter(v)}
                    style={{ padding: '3px 10px', fontSize: 11, border: `1px solid ${filter === v ? C.blue : C.border}`, background: filter === v ? '#2962ff20' : 'transparent', color: filter === v ? C.blue : C.muted, borderRadius: 4, cursor: 'pointer', fontFamily: mono }}>
                    {l}
                  </button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 10, color: C.muted, display: 'flex', alignItems: 'center' }}>Trier:</span>
                  {[['date_desc','Date ↓'],['pnl_desc','P&L ↓'],['rr_desc','R:R ↓']].map(([v,l]) => (
                    <button key={v} onClick={() => setSortBy(v)}
                      style={{ padding: '3px 8px', fontSize: 10, border: `1px solid ${sortBy === v ? C.gold : C.border}`, background: sortBy === v ? '#c6a34e20' : 'transparent', color: sortBy === v ? C.gold : C.muted, borderRadius: 4, cursor: 'pointer', fontFamily: mono }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1, overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: C.bg2, position: 'sticky', top: 0 }}>
                      {['Date','Symbole','Dir.','Setup','Entrée','SL','TP1','Lots','R:R','P&L','Status','Émotion','Actions'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: C.muted, fontWeight: 500, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', fontSize: 10, letterSpacing: '.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => (
                      <tr key={t.id} style={{ borderBottom: `0.5px solid #1e222d` }}
                        onMouseEnter={e => e.currentTarget.style.background = C.bg2}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '8px 10px', color: C.muted, whiteSpace: 'nowrap' }}>{new Date(t.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' })}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: '#fff' }}>{t.symbol}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ color: t.direction === 'long' ? C.green : C.red, fontWeight: 700, fontSize: 10 }}>
                            {t.direction === 'long' ? '▲ L' : '▼ S'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: C.gold, fontSize: 10, whiteSpace: 'nowrap' }}>{t.setup}</td>
                        <td style={{ padding: '8px 10px', color: C.text }}>{typeof t.entry === 'number' ? t.entry.toFixed(t.entry > 100 ? 2 : 5) : t.entry}</td>
                        <td style={{ padding: '8px 10px', color: C.red }}>{typeof t.sl === 'number' ? t.sl.toFixed(t.sl > 100 ? 2 : 5) : t.sl}</td>
                        <td style={{ padding: '8px 10px', color: C.green }}>{typeof t.tp1 === 'number' ? t.tp1.toFixed(t.tp1 > 100 ? 2 : 5) : t.tp1}</td>
                        <td style={{ padding: '8px 10px', color: C.text }}>{t.lots}</td>
                        <td style={{ padding: '8px 10px', color: (t.rr || 0) >= 2 ? C.green : (t.rr || 0) >= 1 ? C.gold : C.red, fontWeight: 600 }}>
                          {t.rr ? `${t.rr}:1` : '—'}
                        </td>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: (t.pnl || 0) > 0 ? C.green : (t.pnl || 0) < 0 ? C.red : C.muted }}>
                          {t.status === 'open' ? <span style={{ color: C.gold, fontSize: 10 }}>EN COURS</span> : `${(t.pnl || 0) > 0 ? '+' : ''}${(t.pnl || 0).toFixed(2)}€`}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: t.status === 'open' ? '#f0b90b20' : (t.pnl || 0) >= 0 ? '#26a69a20' : '#ef535020', color: t.status === 'open' ? '#f0b90b' : (t.pnl || 0) >= 0 ? C.green : C.red }}>
                            {t.status === 'open' ? 'OUVERT' : (t.pnl || 0) >= 0 ? 'WIN' : 'LOSS'}
                          </span>
                        </td>
                        <td style={{ padding: '8px 10px', color: C.muted, fontSize: 10 }}>{t.emotion}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => { setEditTrade(t); setShowForm(true) }} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, color: C.muted, fontSize: 10, padding: '2px 6px', cursor: 'pointer', fontFamily: mono }}>✏️</button>
                            {t.status === 'open' && (
                              <button onClick={() => setCloseId(t.id)} style={{ background: 'none', border: `1px solid ${C.green}40`, borderRadius: 3, color: C.green, fontSize: 10, padding: '2px 6px', cursor: 'pointer', fontFamily: mono }}>Fermer</button>
                            )}
                            <button onClick={() => deleteTrade(t.id)} style={{ background: 'none', border: `1px solid ${C.red}30`, borderRadius: 3, color: C.red, fontSize: 10, padding: '2px 6px', cursor: 'pointer', fontFamily: mono }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div style={{ padding: 30, textAlign: 'center', color: C.muted, fontSize: 12 }}>Aucun trade trouvé</div>
                )}
              </div>
            </>
          )}

          {/* STATS TAB */}
          {tab === 'stats' && (
            <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 18 }}>
                <StatCard label="Win Rate" value={`${stats.winRate}%`} sub={`${stats.wins}W / ${stats.losses}L`} color={stats.winRate >= 50 ? C.green : C.red} />
                <StatCard label="P&L Total" value={`${stats.totalPnL > 0 ? '+' : ''}${stats.totalPnL}€`} sub={`${stats.totalTrades} trades fermés`} color={stats.totalPnL >= 0 ? C.green : C.red} />
                <StatCard label="R:R Moyen" value={`${stats.avgRR}:1`} sub="par trade" color={stats.avgRR >= 2 ? C.green : C.gold} />
                <StatCard label="Profit Factor" value={stats.profitFactor} sub={`Win moy: +${stats.avgWin}€`} color={stats.profitFactor >= 1.5 ? C.green : C.red} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>Performance par setup</div>
                  {stats.bySetup?.map(s => (
                    <div key={s.setup} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: C.text }}>{s.setup}</span>
                        <span style={{ fontSize: 11, color: s.pnl >= 0 ? C.green : C.red, fontFamily: mono }}>{s.pnl > 0 ? '+' : ''}{s.pnl.toFixed(0)}€ ({s.count})</span>
                      </div>
                      <MiniBar value={Math.abs(s.pnl)} max={Math.max(...(stats.bySetup?.map(x => Math.abs(x.pnl)) || [1]))} color={s.pnl >= 0 ? C.green : C.red} />
                    </div>
                  ))}
                </div>
                <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>Meilleur / Pire trade</div>
                  <div style={{ padding: '10px', background: '#26a69a10', border: '1px solid #26a69a30', borderRadius: 6, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, color: C.muted }}>Meilleur trade</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.green, fontFamily: mono }}>+{stats.bestTrade?.toFixed(2)}€</div>
                  </div>
                  <div style={{ padding: '10px', background: '#ef535010', border: '1px solid #ef535030', borderRadius: 6 }}>
                    <div style={{ fontSize: 10, color: C.muted }}>Pire trade</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: C.red, fontFamily: mono }}>{stats.worstTrade?.toFixed(2)}€</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PSYCHOLOGY TAB */}
          {tab === 'psychology' && (
            <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
              <div style={{ background: C.bg2, border: `0.5px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>Win Rate par état émotionnel</div>
                {stats.byEmotion?.map(e => (
                  <div key={e.emotion} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: C.text, textTransform: 'capitalize' }}>{e.emotion}</span>
                      <span style={{ fontSize: 12, fontFamily: mono, color: e.winRate >= 60 ? C.green : e.winRate >= 40 ? C.gold : C.red, fontWeight: 600 }}>
                        {e.winRate}% WR ({e.count} trades)
                      </span>
                    </div>
                    <MiniBar value={e.winRate} max={100} color={e.winRate >= 60 ? C.green : e.winRate >= 40 ? C.gold : C.red} />
                  </div>
                ))}
              </div>
              <div style={{ background: '#f0b90b10', border: '1px solid #f0b90b30', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f0b90b', marginBottom: 8 }}>💡 Insights psychologiques</div>
                <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7 }}>
                  {stats.byEmotion?.find(e => e.emotion === 'revenge') && (
                    <div style={{ marginBottom: 6 }}>⚠️ <strong>Revenge trading détecté</strong> — tes trades en mode "revenge" ont un WR de {stats.byEmotion.find(e => e.emotion === 'revenge').winRate}%. Évite de trader après une perte.</div>
                  )}
                  {stats.byEmotion?.find(e => e.emotion === 'FOMO') && (
                    <div style={{ marginBottom: 6 }}>⚠️ <strong>FOMO identifié</strong> — {stats.byEmotion.find(e => e.emotion === 'FOMO').winRate}% WR en mode FOMO. Attends la confirmation de setup.</div>
                  )}
                  {stats.byEmotion?.find(e => e.emotion === 'patient') && (
                    <div style={{ marginBottom: 6 }}>✅ <strong>La patience paie</strong> — {stats.byEmotion.find(e => e.emotion === 'patient').winRate}% WR quand tu es patient. Continue.</div>
                  )}
                  {stats.byEmotion?.find(e => e.emotion === 'confiant') && (
                    <div>✅ <strong>Confiance = performance</strong> — {stats.byEmotion.find(e => e.emotion === 'confiant').winRate}% WR quand tu es confiant. Fais confiance à ton analyse.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Close trade modal */}
        {closeId && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: mono }}>
            <div style={{ background: C.bg2, border: `1px solid ${C.border}`, borderRadius: 8, padding: 20, width: 300 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 14 }}>Fermer le trade</div>
              <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Prix de clôture</label>
              <input type="number" value={closePrice} onChange={e => setClosePrice(e.target.value)} autoFocus
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, color: C.text, fontSize: 13, padding: '8px 10px', fontFamily: mono, outline: 'none', marginBottom: 12 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { closeTrade(closeId, parseFloat(closePrice)); setCloseId(null); setClosePrice('') }}
                  disabled={!closePrice}
                  style={{ flex: 1, background: C.green, border: 'none', borderRadius: 4, color: '#fff', fontSize: 12, fontWeight: 700, padding: '8px', cursor: closePrice ? 'pointer' : 'default', fontFamily: mono, opacity: closePrice ? 1 : 0.5 }}>
                  Confirmer
                </button>
                <button onClick={() => setCloseId(null)} style={{ padding: '8px 14px', background: '#2a2e39', border: 'none', borderRadius: 4, color: C.muted, fontSize: 12, cursor: 'pointer', fontFamily: mono }}>
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showForm && <TradeForm onClose={() => { setShowForm(false); setEditTrade(null) }} editTrade={editTrade} />}
    </div>
  )
}
