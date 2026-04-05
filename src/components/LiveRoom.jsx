import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../store/auth'
import { useStore, SYMBOLS } from '../store'
import { supabase } from '../lib/supabase'

const gold = '#c6a34e'

// Mock messages pour demo sans Supabase
const DEMO_MESSAGES = [
  { id: 1, user: 'Lucas', role: 'host', content: 'Bonjour à tous ! On est en live sur XAUUSD H1 🔥', time: '09:02', color: gold },
  { id: 2, user: 'Nourdin', role: 'host', content: 'Bias bullish aujourd\'hui — on attend le retour sur l\'OB à 2318', time: '09:05', color: '#2962ff' },
  { id: 3, user: 'trader_92', role: 'member', content: 'Je vois le même setup, confluence parfaite avec l\'EMA 20', time: '09:07', color: '#26a69a' },
  { id: 4, user: 'ahmed_fx', role: 'member', content: 'SL sous le low de la bougie H4 ?', time: '09:08', color: '#9c27b0' },
  { id: 5, user: 'Lucas', role: 'host', content: 'Exactement Ahmed — SL à 2312, TP1 2338, TP2 2355. R:R > 3', time: '09:09', color: gold },
  { id: 6, user: 'sarah_trade', role: 'member', content: 'En position depuis 2319 👌', time: '09:10', color: '#00bcd4' },
  { id: 7, user: 'fouad_pips', role: 'member', content: 'Volume spike sur la M15, confirmation bullish', time: '09:11', color: '#ff9800' },
]

export default function LiveRoom({ onClose }) {
  const { user, profile } = useAuth()
  const { symbol, livePrice, priceChange, priceChangePct } = useStore()
  const [messages, setMessages] = useState(DEMO_MESSAGES)
  const [input, setInput] = useState('')
  const [viewers, setViewers] = useState(47)
  const [isLive, setIsLive] = useState(true)
  const [hostSharing, setHostSharing] = useState(true)
  const messagesEndRef = useRef(null)
  const channelRef = useRef(null)

  const symInfo = SYMBOLS.find(s => s.symbol === symbol)
  const isHost = profile?.plan === 'premium'
  const isUp = (priceChange || 0) >= 0

  const fmt = (p) => {
    if (!p) return '—'
    if (p > 1000) return p.toFixed(2)
    if (p > 1) return p.toFixed(4)
    return p.toFixed(5)
  }

  useEffect(() => {
    // Supabase Realtime channel pour le chat live
    // En prod: remplacer par vrai canal Supabase
    // channelRef.current = supabase.channel('live_room')
    //   .on('broadcast', { event: 'message' }, ({ payload }) => {
    //     setMessages(prev => [...prev, payload])
    //   })
    //   .subscribe()

    // Simuler nouveaux viewers
    const viewerInterval = setInterval(() => {
      setViewers(v => v + Math.floor(Math.random() * 3) - 1)
    }, 5000)

    return () => {
      clearInterval(viewerInterval)
      channelRef.current?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || !user) return
    const msg = {
      id: Date.now(),
      user: profile?.full_name || user.email.split('@')[0],
      role: isHost ? 'host' : 'member',
      content: input.trim(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      color: isHost ? gold : '#2962ff'
    }
    setMessages(prev => [...prev, msg])
    setInput('')

    // En prod: broadcast via Supabase
    // await supabase.channel('live_room').send({ type: 'broadcast', event: 'message', payload: msg })
  }

  const roleColors = { host: gold, member: '#787b86' }
  const roleLabels = { host: 'HOST', member: 'MEMBRE' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ background: '#131722', border: '1px solid #2a2e39', borderRadius: 10, width: '100%', maxWidth: 1000, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #2a2e39', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: '#1a1e2d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isLive && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef5350', animation: 'pulse 1s infinite' }} />}
            <span style={{ fontSize: 12, fontWeight: 700, color: isLive ? '#ef5350' : '#787b86' }}>
              {isLive ? 'LIVE' : 'REPLAY'}
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: '#2a2e39' }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>Freeman Academy</div>
          <div style={{ fontSize: 11, color: '#787b86' }}>par Lucas Dzordzie × Nourdin Moussati</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#787b86' }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M1 11c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              <span style={{ color: '#d1d4dc', fontWeight: 600 }}>{viewers}</span> viewers
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#787b86', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
        </div>

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left — Chart shared */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #2a2e39', overflow: 'hidden' }}>

            {/* Shared chart header */}
            <div style={{ padding: '8px 14px', borderBottom: '1px solid #2a2e39', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: '#1a1e2d' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: hostSharing ? '#26a69a' : '#787b86' }} />
                <span style={{ fontSize: 10, color: '#787b86' }}>{hostSharing ? 'Chart partagé par Lucas' : 'Aucun partage actif'}</span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{symbol}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isUp ? '#26a69a' : '#ef5350' }}>{fmt(livePrice)}</span>
                <span style={{ fontSize: 11, color: isUp ? '#26a69a' : '#ef5350' }}>{isUp ? '+' : ''}{(priceChangePct || 0).toFixed(2)}%</span>
              </div>
            </div>

            {/* Chart visual placeholder */}
            <div style={{ flex: 1, background: '#131722', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ textAlign: 'center', color: '#5d606b', fontSize: 12 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
                <div>Chart {symbol} en direct</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Annotations de Lucas visibles en temps réel</div>
              </div>

              {/* Annotation overlay demo */}
              <div style={{ position: 'absolute', top: 20, left: 20, background: '#26a69a15', border: '1px solid #26a69a40', borderRadius: 4, padding: '4px 10px', fontSize: 10, color: '#26a69a' }}>
                🟢 Bull OB : 2318 – 2322
              </div>
              <div style={{ position: 'absolute', top: 50, left: 20, background: '#c6a34e15', border: '1px solid #c6a34e40', borderRadius: 4, padding: '4px 10px', fontSize: 10, color: '#c6a34e' }}>
                🎯 TP1 : 2338 · TP2 : 2355
              </div>
              <div style={{ position: 'absolute', bottom: 30, left: 20, background: '#ef535015', border: '1px solid #ef535040', borderRadius: 4, padding: '4px 10px', fontSize: 10, color: '#ef5350' }}>
                🛑 SL : 2312
              </div>
            </div>

            {/* Host controls */}
            {isHost && (
              <div style={{ padding: '8px 14px', borderTop: '1px solid #2a2e39', display: 'flex', gap: 8, flexShrink: 0, background: '#1a1e2d' }}>
                <button onClick={() => setHostSharing(!hostSharing)}
                  style={{ background: hostSharing ? '#ef535020' : '#26a69a20', border: `1px solid ${hostSharing ? '#ef535040' : '#26a69a40'}`, borderRadius: 4, color: hostSharing ? '#ef5350' : '#26a69a', fontSize: 11, padding: '5px 12px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                  {hostSharing ? '⏸ Arrêter partage' : '▶ Partager mon chart'}
                </button>
                <button style={{ background: '#2962ff20', border: '1px solid #2962ff40', borderRadius: 4, color: '#2962ff', fontSize: 11, padding: '5px 12px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                  📌 Épingler annotation
                </button>
                <button onClick={() => setIsLive(!isLive)}
                  style={{ marginLeft: 'auto', background: isLive ? '#ef535020' : '#26a69a20', border: `1px solid ${isLive ? '#ef535040' : '#26a69a40'}`, borderRadius: 4, color: isLive ? '#ef5350' : '#26a69a', fontSize: 11, padding: '5px 12px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
                  {isLive ? '⏹ Terminer live' : '🔴 Démarrer live'}
                </button>
              </div>
            )}
          </div>

          {/* Right — Chat */}
          <div style={{ width: 300, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #2a2e39', fontSize: 10, color: '#787b86', flexShrink: 0, background: '#1a1e2d' }}>
              Chat live · {messages.length} messages
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ padding: '5px 12px', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: `${msg.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: msg.color }}>
                    {msg.user[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: msg.color }}>{msg.user}</span>
                      {msg.role === 'host' && (
                        <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: `${gold}20`, color: gold, fontWeight: 700 }}>HOST</span>
                      )}
                      <span style={{ fontSize: 9, color: '#5d606b', marginLeft: 'auto' }}>{msg.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#b2b5be', lineHeight: 1.5, wordBreak: 'break-word' }}>{msg.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat input */}
            {user ? (
              <div style={{ padding: '8px 10px', borderTop: '1px solid #2a2e39', display: 'flex', gap: 6, flexShrink: 0 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && input.trim()) sendMessage() }}
                  placeholder="Message..."
                  style={{ flex: 1, background: '#1a1e2d', border: '1px solid #2a2e39', borderRadius: 4, color: '#d1d4dc', fontSize: 11, padding: '6px 9px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
                />
                <button onClick={sendMessage} disabled={!input.trim()}
                  style={{ background: '#2962ff', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, padding: '6px 10px', cursor: input.trim() ? 'pointer' : 'default', opacity: input.trim() ? 1 : 0.5, fontFamily: 'JetBrains Mono, monospace' }}>
                  ↑
                </button>
              </div>
            ) : (
              <div style={{ padding: '10px 12px', borderTop: '1px solid #2a2e39', textAlign: 'center', fontSize: 11, color: '#787b86' }}>
                <button onClick={() => {}} style={{ color: '#2962ff', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                  Connecte-toi pour chatter →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
