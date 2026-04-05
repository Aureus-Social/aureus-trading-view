import { useState, useRef } from 'react'
import { useStore, SYMBOLS } from '../store'
import { detectOrderBlocks, detectFVG, detectStructure, calcEMA, calcRSI } from '../lib/indicators'

const gold = '#c6a34e'

// System prompt SMC institutionnel
const SYSTEM_PROMPT = `Tu es un analyste de trading institutionnel expert en Smart Money Concepts (SMC) et ICT.
Tu analyses les marchés financiers avec précision : XAUUSD, Forex, Crypto, Indices.

Ton analyse couvre :
1. BIAS directionnel (Bullish/Bearish/Neutre) avec justification
2. Structure de marché (BOS, CHOCH, HH/HL ou LH/LL)
3. Order Blocks actifs (prix exact, timeframe, qualité)
4. Fair Value Gaps non comblés
5. Zones de liquidités (equal highs/lows, BSL/SSL)
6. Setup potentiel (entrée, SL, TP1, TP2, R:R)
7. Niveau de conviction (1-10)

Réponds en français, de façon concise et actionnable. Format structuré avec sections claires.
Ne jamais donner de conseils financiers — analyse technique uniquement.`

export default function AIAnalysis({ onClose }) {
  const { symbol, candles } = useStore()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoAnalyzing, setAutoAnalyzing] = useState(false)
  const messagesEndRef = useRef(null)

  const symInfo = SYMBOLS.find(s => s.symbol === symbol)

  const buildContext = () => {
    if (!candles.length) return ''
    const last = candles[candles.length - 1]
    const prices = candles.map(c => c.close)
    const ema20 = calcEMA(prices, 20)
    const ema50 = calcEMA(prices, 50)
    const ema200 = calcEMA(prices, 200)
    const rsi = calcRSI(prices, 14)
    const obs = detectOrderBlocks(candles)
    const fvgs = detectFVG(candles)
    const struct = detectStructure(candles)

    const bullOBs = obs.filter(o => o.type === 'bull' && o.intact)
    const bearOBs = obs.filter(o => o.type === 'bear' && o.intact)
    const bullFVGs = fvgs.filter(f => f.type === 'bull')
    const bearFVGs = fvgs.filter(f => f.type === 'bear')

    return `
DONNÉES MARCHÉ — ${symbol} (${symInfo?.name})
Prix actuel : ${last.close.toFixed(4)}
OHLC dernière bougie : O${last.open.toFixed(4)} H${last.high.toFixed(4)} L${last.low.toFixed(4)} C${last.close.toFixed(4)}
Volume : ${(last.volume/1000).toFixed(1)}K

INDICATEURS :
- EMA 20 : ${ema20[ema20.length-1].toFixed(4)} — Prix ${last.close > ema20[ema20.length-1] ? 'AU-DESSUS' : 'EN-DESSOUS'}
- EMA 50 : ${ema50[ema50.length-1].toFixed(4)} — Prix ${last.close > ema50[ema50.length-1] ? 'AU-DESSUS' : 'EN-DESSOUS'}
- EMA 200 : ${ema200[ema200.length-1].toFixed(4)} — Prix ${last.close > ema200[ema200.length-1] ? 'AU-DESSUS (Bullish LT)' : 'EN-DESSOUS (Bearish LT)'}
- RSI (14) : ${rsi[rsi.length-1].toFixed(1)} — ${rsi[rsi.length-1] > 70 ? 'Surachat' : rsi[rsi.length-1] < 30 ? 'Survente' : 'Zone neutre'}

SMC — ORDER BLOCKS :
${bullOBs.map(ob => `- Bull OB intact : ${ob.low.toFixed(4)} — ${ob.high.toFixed(4)}`).join('\n') || '- Aucun Bull OB intact'}
${bearOBs.map(ob => `- Bear OB intact : ${ob.low.toFixed(4)} — ${ob.high.toFixed(4)}`).join('\n') || '- Aucun Bear OB intact'}

SMC — FAIR VALUE GAPS :
${bullFVGs.map(f => `- Bull FVG : ${f.bottom.toFixed(4)} — ${f.top.toFixed(4)}`).join('\n') || '- Aucun Bull FVG'}
${bearFVGs.map(f => `- Bear FVG : ${f.bottom.toFixed(4)} — ${f.top.toFixed(4)}`).join('\n') || '- Aucun Bear FVG'}

STRUCTURE :
- Swing Highs récents : ${struct.swingHighs.slice(-3).map(h => h.price.toFixed(4)).join(', ') || 'N/A'}
- Swing Lows récents : ${struct.swingLows.slice(-3).map(l => l.price.toFixed(4)).join(', ') || 'N/A'}
`
  }

  const sendMessage = async (userMsg) => {
    const context = buildContext()
    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT + '\n\n' + context,
          messages: newMessages,
        })
      })
      const data = await response.json()
      const reply = data.content?.[0]?.text || 'Erreur de réponse'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Erreur : ${e.message}. Vérifie ta connexion.` }])
    }
    setLoading(false)
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const autoAnalyze = async () => {
    setAutoAnalyzing(true)
    const context = buildContext()
    setMessages([{ role: 'user', content: `Analyse complète SMC pour ${symbol} s'il te plaît.` }])
    setLoading(true)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT + '\n\n' + context,
          messages: [{ role: 'user', content: `Donne-moi une analyse SMC complète et structurée pour ${symbol}. Inclus : bias, structure, OB actifs, FVG, setup potentiel avec niveaux précis.` }],
        })
      })
      const data = await response.json()
      const reply = data.content?.[0]?.text || 'Erreur'
      setMessages([
        { role: 'user', content: `Analyse complète SMC pour ${symbol}` },
        { role: 'assistant', content: reply }
      ])
    } catch (e) {
      setMessages([{ role: 'user', content: '' }, { role: 'assistant', content: `Erreur : ${e.message}` }])
    }
    setLoading(false)
    setAutoAnalyzing(false)
  }

  const quickPrompts = [
    `Quel est le bias directionnel actuel sur ${symbol} ?`,
    `Y a-t-il un setup d'entrée valide en ce moment ?`,
    `Identifie les zones de liquidités clés`,
    `Quels sont les niveaux de prix critiques ?`,
    `Analyse la structure de marché actuelle`,
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'JetBrains Mono, monospace' }}>
      <div style={{ background: '#1a1e2d', border: '1px solid #2a2e39', borderRadius: 10, width: '100%', maxWidth: 720, maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2a2e39', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${gold}20`, border: `1px solid ${gold}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M9 1L16 15H2Z" fill={gold}/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Aureus AI — Analyse SMC</div>
              <div style={{ fontSize: 10, color: '#787b86' }}>{symbol} · {symInfo?.name} · Powered by Claude</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={autoAnalyze} disabled={loading}
              style={{ background: `${gold}20`, border: `1px solid ${gold}40`, borderRadius: 5, color: gold, fontSize: 11, fontWeight: 700, padding: '5px 12px', cursor: loading ? 'default' : 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
              {autoAnalyzing ? '⏳ Analyse...' : '⚡ Analyse auto'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#787b86', cursor: 'pointer', fontSize: 22 }}>×</button>
          </div>
        </div>

        {/* Context bar */}
        {candles.length > 0 && (() => {
          const last = candles[candles.length - 1]
          const prices = candles.map(c => c.close)
          const rsi = calcRSI(prices, 14)
          const ema200 = calcEMA(prices, 200)
          const bias = last.close > ema200[ema200.length - 1] ? '▲ BULLISH' : '▼ BEARISH'
          const biasColor = last.close > ema200[ema200.length - 1] ? '#26a69a' : '#ef5350'
          return (
            <div style={{ padding: '8px 20px', borderBottom: '1px solid #2a2e39', display: 'flex', gap: 16, fontSize: 10, flexShrink: 0 }}>
              <span style={{ color: biasColor, fontWeight: 700 }}>{bias}</span>
              <span style={{ color: '#787b86' }}>Prix <span style={{ color: '#d1d4dc' }}>{last.close.toFixed(4)}</span></span>
              <span style={{ color: '#787b86' }}>RSI <span style={{ color: rsi[rsi.length-1] > 70 ? '#ef5350' : rsi[rsi.length-1] < 30 ? '#26a69a' : '#d1d4dc' }}>{rsi[rsi.length-1].toFixed(1)}</span></span>
              <span style={{ color: '#787b86' }}>EMA200 <span style={{ color: '#e91e63' }}>{ema200[ema200.length-1].toFixed(4)}</span></span>
            </div>
          )
        })()}

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#5d606b' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🤖</div>
              <div style={{ fontSize: 12, marginBottom: 6, color: '#787b86' }}>Analyse SMC instantanée pour {symbol}</div>
              <div style={{ fontSize: 11, color: '#5d606b', marginBottom: 20 }}>Clique sur "Analyse auto" ou pose une question</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 400, margin: '0 auto' }}>
                {quickPrompts.map((p, i) => (
                  <button key={i} onClick={() => sendMessage(p)}
                    style={{ background: '#2a2e39', border: '1px solid #363c4e', borderRadius: 6, color: '#b2b5be', fontSize: 11, padding: '8px 12px', cursor: 'pointer', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 14, display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, background: msg.role === 'user' ? '#2962ff' : `${gold}30`, color: msg.role === 'user' ? '#fff' : gold }}>
                {msg.role === 'user' ? 'N' : 'AI'}
              </div>
              <div style={{ maxWidth: '82%', background: msg.role === 'user' ? '#2962ff20' : '#2a2e39', borderRadius: msg.role === 'user' ? '10px 2px 10px 10px' : '2px 10px 10px 10px', padding: '10px 14px', fontSize: 12, color: '#d1d4dc', lineHeight: 1.7, whiteSpace: 'pre-wrap', border: `1px solid ${msg.role === 'user' ? '#2962ff30' : '#363c4e'}` }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${gold}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: gold }}>AI</div>
              <div style={{ background: '#2a2e39', borderRadius: '2px 10px 10px 10px', padding: '10px 14px', border: '1px solid #363c4e' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: gold, animation: `pulse 1.2s ${i*0.2}s infinite`, opacity: 0.6 }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '10px 14px', borderTop: '1px solid #2a2e39', display: 'flex', gap: 8, flexShrink: 0 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && input.trim()) { e.preventDefault(); sendMessage(input.trim()) } }}
            placeholder={`Pose une question sur ${symbol}...`}
            disabled={loading}
            style={{ flex: 1, background: '#131722', border: '1px solid #2a2e39', borderRadius: 5, color: '#d1d4dc', fontSize: 12, padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', outline: 'none' }}
          />
          <button onClick={() => input.trim() && sendMessage(input.trim())} disabled={loading || !input.trim()}
            style={{ background: '#2962ff', border: 'none', borderRadius: 5, color: '#fff', fontSize: 12, padding: '8px 14px', cursor: loading || !input.trim() ? 'default' : 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, fontFamily: 'JetBrains Mono, monospace' }}>
            Envoyer
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:.3} 50%{opacity:1} }`}</style>
    </div>
  )
}
