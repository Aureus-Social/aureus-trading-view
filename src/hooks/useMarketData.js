import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { generateMockCandles, simulateTick } from '../lib/indicators'
import { SYMBOLS } from '../store'

export function useMarketData() {
  const { symbol, timeframe, setCandles, setLivePrice, updateWatchlistPrice, watchlist } = useStore()
  const tickIntervalRef = useRef(null)

  useEffect(() => {
    // Load initial candles for main chart
    const sym = SYMBOLS.find(s => s.symbol === symbol)
    const candles = generateMockCandles(200, sym?.base || 2320, symbol)
    setCandles(candles)

    const first = candles[0]
    const last = candles[candles.length - 1]
    const change = last.close - first.close
    const pct = (change / first.close) * 100
    setLivePrice(last.close, change, pct)

    // Initialize watchlist prices
    watchlist.forEach(sym => {
      const s = SYMBOLS.find(x => x.symbol === sym)
      if (!s) return
      const base = s.base
      const price = base + (Math.random() - 0.49) * base * 0.002
      const chgPct = (Math.random() - 0.49) * 1.5
      updateWatchlistPrice(sym, price, chgPct)
    })

    // Live tick simulation (Polygon.io WebSocket en prod)
    tickIntervalRef.current = setInterval(() => {
      setCandles(prev => {
        if (!prev.length) return prev
        const last = prev[prev.length - 1]
        const updated = simulateTick(last)
        const change = updated.close - prev[0].close
        const pct = (change / prev[0].close) * 100
        setLivePrice(updated.close, change, pct)
        return [...prev.slice(0, -1), updated]
      })

      // Simulate watchlist price moves
      watchlist.forEach(sym => {
        if (sym === symbol) return
        const s = SYMBOLS.find(x => x.symbol === sym)
        if (!s) return
        const base = s.base
        const price = base + (Math.random() - 0.49) * base * 0.003
        const chgPct = (Math.random() - 0.49) * 2
        updateWatchlistPrice(sym, price, chgPct)
      })
    }, 800)

    return () => clearInterval(tickIntervalRef.current)
  }, [symbol, timeframe])
}
