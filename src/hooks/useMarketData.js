import { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { generateMockCandles, simulateTick } from '../lib/indicators'
import { SYMBOLS } from '../store'

// In production: replace POLYGON_API_KEY and connect to wss://socket.polygon.io/forex
// Docs: https://polygon.io/docs/forex/get_v2_aggs_ticker__forexticker__range__multiplier___timespan___from___to_
const POLYGON_API_KEY = import.meta.env.VITE_POLYGON_API_KEY || null

export function useMarketData() {
  const { symbol, timeframe, setCandles, setLivePrice, updateWatchlistPrice, watchlist } = useStore()
  const intervalRef = useRef(null)
  const tickIntervalRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    // Load initial candles
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
      if (s) {
        const mock = generateMockCandles(2, s.base, sym)
        const chg = mock[1].close - mock[0].close
        updateWatchlistPrice(sym, mock[1].close, (chg / mock[0].close) * 100)
      }
    })

    // Simulate live ticks (replace with Polygon.io WebSocket in production)
    // Production: wss://socket.polygon.io/forex
    // const ws = new WebSocket('wss://socket.polygon.io/forex')
    // ws.onopen = () => { ws.send(JSON.stringify({ action: 'auth', params: POLYGON_API_KEY })) }
    // ws.onmessage = (e) => { /* handle tick */ }
    // wsRef.current = ws

    tickIntervalRef.current = setInterval(() => {
      setCandles(prev => {
        if (!prev.length) return prev
        const last = prev[prev.length - 1]
        const updated = simulateTick(last)
        const change = updated.close - prev[0].close
        const pct = (change / prev[0].close) * 100
        setLivePrice(updated.close, change, pct)

        // Simulate watchlist updates
        watchlist.forEach(sym => {
          if (sym !== symbol) {
            updateWatchlistPrice(sym, prev => {
              const s = SYMBOLS.find(x => x.symbol === sym)
              const base = s?.base || 100
              return base + (Math.random() - 0.49) * base * 0.001
            })
          }
        })

        return [...prev.slice(0, -1), updated]
      })
    }, 800) // ~800ms tick simulation

    return () => {
      clearInterval(tickIntervalRef.current)
      if (wsRef.current) wsRef.current.close()
    }
  }, [symbol, timeframe])
}
