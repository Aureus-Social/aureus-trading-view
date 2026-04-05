import { useState, useEffect, useRef, useCallback } from 'react'
import { createChart, CandlestickSeries, LineSeries } from 'lightweight-charts'
import { useStore, SYMBOLS, TIMEFRAMES } from '../store'
import { calcEMA, calcRSI, generateMockCandles, detectOrderBlocks } from '../lib/indicators'

const mono = 'JetBrains Mono, monospace'
const C = { bg: '#131722', bg2: '#1e222d', border: '#2a2e39', text: '#d1d4dc', muted: '#787b86', green: '#26a69a', red: '#ef5350', gold: '#c6a34e', blue: '#2962ff' }

export default function ReplayMode({ onClose }) {
  const { symbol, colors } = useStore()
  const [replaySymbol, setReplaySymbol] = useState(symbol)
  const [speed, setSpeed] = useState(500)
  const [playing, setPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(50)
  const [allCandles, setAllCandles] = useState([])
  const [showEMA, setShowEMA] = useState(true)
  const [showOB, setShowOB] = useState(true)

  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const mainSeriesRef = useRef(null)
  const ema20Ref = useRef(null)
  const ema50Ref = useRef(null)
  const playRef = useRef(null)
  const indexRef = useRef(currentIndex)

  indexRef.current = currentIndex

  // Init all candles
  useEffect(() => {
    const sym = SYMBOLS.find(s => s.symbol === replaySymbol)
    const candles = generateMockCandles(300, sym?.base || 2320, replaySymbol)
    setAllCandles(candles)
    setCurrentIndex(50)
    setPlaying(false)
  }, [replaySymbol])

  // Init chart
  useEffect(() => {
    if (!containerRef.current) return
    chartRef.current = createChart(containerRef.current, {
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
      layout: { background: { type: 'solid', color: C.bg }, textColor: C.muted, fontFamily: mono, fontSize: 11 },
      grid: { vertLines: { color: C.bg2 }, horzLines: { color: C.bg2 } },
      crosshair: { mode: 1, vertLine: { labelBackgroundColor: C.blue }, horzLine: { labelBackgroundColor: C.blue } },
      rightPriceScale: { borderColor: C.border },
      timeScale: { borderColor: C.border, timeVisible: true },
    })
    mainSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
      upColor: C.green, downColor: C.red,
      borderUpColor: C.green, borderDownColor: C.red,
      wickUpColor: C.green, wickDownColor: C.red,
    })
    ema20Ref.current = chartRef.current.addSeries(LineSeries, { color: '#2196f3', lineWidth: 1.5, priceLineVisible: false })
    ema50Ref.current = chartRef.current.addSeries(LineSeries, { color: '#ff9800', lineWidth: 1.5, priceLineVisible: false })

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current)
        chartRef.current.applyOptions({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight })
    })
    ro.observe(containerRef.current)
    return () => { ro.disconnect(); chartRef.current?.remove() }
  }, [])

  // Update chart when index changes
  useEffect(() => {
    if (!allCandles.length || !mainSeriesRef.current) return
    const visible = allCandles.slice(0, currentIndex + 1)
    mainSeriesRef.current.setData(visible)

    if (showEMA) {
      const prices = visible.map(c => c.close)
      const e20 = calcEMA(prices, 20)
      const e50 = calcEMA(prices, 50)
      ema20Ref.current?.setData(visible.map((c, i) => ({ time: c.time, value: e20[i] })))
      ema50Ref.current?.setData(visible.map((c, i) => ({ time: c.time, value: e50[i] })))
    }

    chartRef.current?.timeScale().scrollToPosition(-3, false)
  }, [currentIndex, allCandles, showEMA])

  // Playback loop
  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= allCandles.length - 1) { setPlaying(false); return prev }
          return prev + 1
        })
      }, speed)
    }
    return () => clearInterval(playRef.current)
  }, [playing, speed, allCandles.length])

  const currentCandle = allCandles[currentIndex]
  const prevCandle = allCandles[currentIndex - 1]
  const change = currentCandle && prevCandle ? currentCandle.close - prevCandle.close : 0
  const isUp = change >= 0

  const fmt = (p) => !p ? '—' : p > 1000 ? p.toFixed(2) : p.toFixed(4)
  const progress = allCandles.length > 0 ? Math.round((currentIndex / (allCandles.length - 1)) * 100) : 0

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: mono }}>
      <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, width: '100%', maxWidth: 1100, height: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, background: C.bg2 }}>
          <div style={{ fontSize: 9, padding: '2px 8px', borderRadius: 3, background: '#ef535020', color: C.red, fontWeight: 700, letterSpacing: '.08em' }}>REPLAY</div>
          <select value={replaySymbol} onChange={e => setReplaySymbol(e.target.value)}
            style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4, color: '#fff', fontSize: 13, fontWeight: 700, padding: '4px 8px', fontFamily: mono, cursor: 'pointer' }}>
            {SYMBOLS.map(s => <option key={s.symbol}>{s.symbol}</option>)}
          </select>
          {currentCandle && (
            <>
              <span style={{ fontSize: 13, fontWeight: 700, color: isUp ? C.green : C.red }}>{fmt(currentCandle.close)}</span>
              <span style={{ fontSize: 11, color: isUp ? C.green : C.red }}>{isUp ? '+' : ''}{change.toFixed(2)}</span>
              <span style={{ fontSize: 10, color: C.muted }}>Bougie {currentIndex + 1}/{allCandles.length}</span>
            </>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 10, color: C.muted }}>
              <input type="checkbox" checked={showEMA} onChange={e => setShowEMA(e.target.checked)} style={{ marginRight: 4, accentColor: C.blue }} />
              EMA
            </label>
            <label style={{ fontSize: 10, color: C.muted }}>
              <input type="checkbox" checked={showOB} onChange={e => setShowOB(e.target.checked)} style={{ marginRight: 4, accentColor: C.gold }} />
              OB
            </label>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
        </div>

        {/* Chart */}
        <div ref={containerRef} style={{ flex: 1 }} />

        {/* Controls */}
        <div style={{ padding: '10px 16px', borderTop: `1px solid ${C.border}`, background: C.bg2, flexShrink: 0 }}>
          {/* Progress bar */}
          <div style={{ marginBottom: 10, position: 'relative' }}>
            <input type="range" min={1} max={allCandles.length - 1} value={currentIndex}
              onChange={e => { setPlaying(false); setCurrentIndex(parseInt(e.target.value)) }}
              style={{ width: '100%', accentColor: C.blue, height: 4 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: C.muted, marginTop: 2 }}>
              <span>Début</span>
              <span style={{ color: C.blue, fontWeight: 600 }}>{progress}%</span>
              <span>Fin</span>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => { setPlaying(false); setCurrentIndex(1) }}
              style={{ background: '#2a2e39', border: 'none', borderRadius: 4, color: C.text, fontSize: 16, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⏮
            </button>
            <button onClick={() => setCurrentIndex(i => Math.max(1, i - 1))}
              style={{ background: '#2a2e39', border: 'none', borderRadius: 4, color: C.text, fontSize: 16, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ◀
            </button>
            <button onClick={() => setPlaying(!playing)}
              style={{ background: playing ? '#ef535030' : '#2962ff', border: 'none', borderRadius: 6, color: '#fff', fontSize: 16, width: 48, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {playing ? '⏸' : '▶'}
            </button>
            <button onClick={() => setCurrentIndex(i => Math.min(allCandles.length - 1, i + 1))}
              style={{ background: '#2a2e39', border: 'none', borderRadius: 4, color: C.text, fontSize: 16, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ▶
            </button>
            <button onClick={() => { setPlaying(false); setCurrentIndex(allCandles.length - 1) }}
              style={{ background: '#2a2e39', border: 'none', borderRadius: 4, color: C.text, fontSize: 16, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ⏭
            </button>

            <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: C.muted }}>Vitesse:</span>
              {[[1000,'0.5x'],[500,'1x'],[250,'2x'],[100,'4x'],[50,'8x']].map(([ms, lbl]) => (
                <button key={ms} onClick={() => setSpeed(ms)}
                  style={{ background: speed === ms ? C.blue : '#2a2e39', border: 'none', borderRadius: 4, color: speed === ms ? '#fff' : C.muted, fontSize: 11, padding: '4px 9px', cursor: 'pointer', fontFamily: mono }}>
                  {lbl}
                </button>
              ))}
            </div>

            {currentCandle && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, fontSize: 11 }}>
                <span style={{ color: C.muted }}>O <span style={{ color: C.text }}>{fmt(currentCandle.open)}</span></span>
                <span style={{ color: C.muted }}>H <span style={{ color: C.green }}>{fmt(currentCandle.high)}</span></span>
                <span style={{ color: C.muted }}>L <span style={{ color: C.red }}>{fmt(currentCandle.low)}</span></span>
                <span style={{ color: C.muted }}>C <span style={{ color: isUp ? C.green : C.red, fontWeight: 700 }}>{fmt(currentCandle.close)}</span></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
