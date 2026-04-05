import { useEffect, useRef } from 'react'
import { useStore, SYMBOLS } from '../store'
import { generateMockCandles, simulateTick } from '../lib/indicators'

export function useMarketData() {
  const store = useStore
  const tickRef = useRef(null)

  const { symbol, timeframe } = useStore()

  useEffect(() => {
    const { setCandles, setLivePrice, updateWatchlistPrice, watchlist } = useStore.getState()
    const sym = SYMBOLS.find(s => s.symbol === symbol)

    // Load initial candles
    const candles = generateMockCandles(200, sym?.base || 2320, symbol)
    setCandles(candles)

    const first = candles[0]
    const last  = candles[candles.length - 1]
    setLivePrice(last.close, last.close - first.close, ((last.close - first.close) / first.close) * 100)

    // Init watchlist prices
    watchlist.forEach(s => {
      const info = SYMBOLS.find(x => x.symbol === s)
      if (!info) return
      const price  = info.base * (1 + (Math.random() - 0.49) * 0.002)
      const chgPct = (Math.random() - 0.49) * 1.5
      updateWatchlistPrice(s, price, chgPct)
    })

    // Live tick — utilise getState() pour éviter le callback Zustand
    tickRef.current = setInterval(() => {
      const state = useStore.getState()
      const prev  = state.candles
      if (!prev || !prev.length) return

      const updated = simulateTick(prev[prev.length - 1])
      const newCandles = [...prev.slice(0, -1), updated]
      state.setCandles(newCandles)

      const change = updated.close - newCandles[0].close
      const pct    = (change / newCandles[0].close) * 100
      state.setLivePrice(updated.close, change, pct)

      // Watchlist updates
      state.watchlist.forEach(s => {
        if (s === symbol) return
        const info = SYMBOLS.find(x => x.symbol === s)
        if (!info) return
        const price  = info.base * (1 + (Math.random() - 0.49) * 0.003)
        const chgPct = (Math.random() - 0.49) * 2
        state.updateWatchlistPrice(s, price, chgPct)
      })
    }, 800)

    return () => clearInterval(tickRef.current)
  }, [symbol, timeframe])
}
