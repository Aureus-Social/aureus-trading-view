import { useEffect, useRef } from 'react'
import {
  createChart, CandlestickSeries, BarSeries,
  LineSeries, AreaSeries, HistogramSeries
} from 'lightweight-charts'
import { useStore } from '../store'
import {
  calcEMA, calcSMA, calcWMA, calcRSI, calcMACD,
  calcBollingerBands, calcVWAP,
  detectOrderBlocks, toHeikinAshi
} from '../lib/indicators'

export default function Chart() {
  const mainRef  = useRef(null)
  const rsiRef   = useRef(null)
  const macdRef  = useRef(null)
  const volRef   = useRef(null)
  const chartsR  = useRef({})
  const seriesR  = useRef({})
  const initDone = useRef(false)

  const {
    candles, chartType, colors, indicators,
    showRSI, showMACD, showVolume,
    showBB, showOB, showVWAP,
  } = useStore()

  const baseOpts = (c) => ({
    layout: {
      background: { type: 'solid', color: c.background },
      textColor: c.text,
      fontFamily: "'JetBrains Mono',monospace",
      fontSize: 11,
    },
    grid: { vertLines: { color: c.grid }, horzLines: { color: c.grid } },
    crosshair: {
      vertLine: { labelBackgroundColor: '#2962ff' },
      horzLine: { labelBackgroundColor: '#2962ff' },
    },
    rightPriceScale: { borderColor: c.grid },
    timeScale: { borderColor: c.grid, timeVisible: true },
    handleScroll: { mouseWheel: true, pressedMouseMove: true },
    handleScale:  { mouseWheel: true, pinch: true },
  })

  // Init charts once — all 4 containers are always rendered
  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    const make = (el, extra) => {
      if (!el) return null
      try {
        return createChart(el, { ...baseOpts(colors), width: el.offsetWidth, height: el.offsetHeight, ...extra })
      } catch(e) { console.error('createChart error:', e); return null }
    }

    chartsR.current.main = make(mainRef.current)
    chartsR.current.rsi  = make(rsiRef.current,  { timeScale: { visible: false } })
    chartsR.current.macd = make(macdRef.current, { timeScale: { visible: false } })
    chartsR.current.vol  = make(volRef.current,  { timeScale: { visible: false } })

    const ro = new ResizeObserver(() => {
      ;[['main', mainRef], ['rsi', rsiRef], ['macd', macdRef], ['vol', volRef]].forEach(([k, ref]) => {
        if (ref.current && chartsR.current[k])
          chartsR.current[k].applyOptions({ width: ref.current.offsetWidth, height: ref.current.offsetHeight })
      })
    })
    ;[mainRef, rsiRef, macdRef, volRef].forEach(r => r.current && ro.observe(r.current))

    return () => {
      ro.disconnect()
      Object.values(chartsR.current).forEach(c => { try { c?.remove() } catch(_){} })
      chartsR.current = {}; seriesR.current = {}; initDone.current = false
    }
  }, [])

  // Update colors
  useEffect(() => {
    const o = baseOpts(colors)
    Object.values(chartsR.current).forEach(c => { try { c?.applyOptions(o) } catch(_){} })
  }, [colors])

  // Update data
  useEffect(() => {
    const chart = chartsR.current.main
    if (!chart || !candles.length) return

    // Remove all old series safely
    Object.entries(seriesR.current).forEach(([k, s]) => {
      ;['main','rsi','macd','vol'].forEach(ck => { try { chartsR.current[ck]?.removeSeries(s) } catch(_){} })
    })
    seriesR.current = {}

    const prices = candles.map(c => c.close)
    const dc = chartType === 'heikinashi' ? toHeikinAshi(candles) : candles
    const add = (chart, Type, opts) => { try { return chart.addSeries(Type, opts) } catch(e) { console.error(e); return null } }

    // Main series
    let main = null
    if (chartType === 'line') {
      main = add(chart, LineSeries, { color: colors.upCandle, lineWidth: 2 })
      main?.setData(dc.map(c => ({ time: c.time, value: c.close })))
    } else if (chartType === 'area') {
      main = add(chart, AreaSeries, { lineColor: colors.upCandle, topColor: colors.upCandle+'40', bottomColor: colors.upCandle+'05', lineWidth: 2 })
      main?.setData(dc.map(c => ({ time: c.time, value: c.close })))
    } else if (chartType === 'bar') {
      main = add(chart, BarSeries, { upColor: colors.upCandle, downColor: colors.downCandle })
      main?.setData(dc.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })))
    } else {
      main = add(chart, CandlestickSeries, {
        upColor: chartType === 'hollow' ? 'transparent' : colors.upCandle,
        downColor: chartType === 'hollow' ? 'transparent' : colors.downCandle,
        borderUpColor: colors.upCandle, borderDownColor: colors.downCandle,
        wickUpColor: colors.upWick, wickDownColor: colors.downWick,
      })
      main?.setData(dc.map(c => ({ time: c.time, open: c.open, high: c.high, low: c.low, close: c.close })))
    }
    if (main) seriesR.current.main = main

    // MAs
    indicators.filter(i => i.visible).forEach(ind => {
      let vals
      if      (ind.type === 'EMA') vals = calcEMA(prices, ind.period)
      else if (ind.type === 'SMA') vals = calcSMA(prices, ind.period)
      else if (ind.type === 'WMA') vals = calcWMA(prices, ind.period)
      else return
      const s = add(chart, LineSeries, { color: ind.color, lineWidth: ind.width || 1.5, priceLineVisible: false })
      s?.setData(candles.map((c,i) => vals[i]!=null ? { time:c.time, value:vals[i] } : null).filter(Boolean))
      if (s) seriesR.current[`ma_${ind.id}`] = s
    })

    // Bollinger
    if (showBB) {
      const bb = calcBollingerBands(prices, 20, 2)
      ;['upper','middle','lower'].forEach((k,idx) => {
        const s = add(chart, LineSeries, { color:'#9c27b070', lineWidth:0.8, priceLineVisible:false, lineStyle:2 })
        s?.setData(candles.map((c,i) => bb[i][k]!=null ? { time:c.time, value:bb[i][k] } : null).filter(Boolean))
        if (s) seriesR.current[`bb_${k}`] = s
      })
    }

    // VWAP
    if (showVWAP) {
      const vwap = calcVWAP(candles)
      const s = add(chart, LineSeries, { color:'#00bcd4', lineWidth:1.5, lineStyle:2, priceLineVisible:false })
      s?.setData(candles.map((c,i) => ({ time:c.time, value:vwap[i] })))
      if (s) seriesR.current.vwap = s
    }

    // Order Blocks
    if (showOB) {
      const obs = detectOrderBlocks(candles)
      obs.forEach((ob, idx) => {
        const col = ob.type === 'bull' ? '#26a69a60' : '#ef535060'
        const t0 = candles[ob.index]?.time, tN = candles[candles.length-1]?.time
        if (!t0 || !tN) return
        const hi = add(chart, LineSeries, { color: col, lineWidth:1, priceLineVisible:false })
        const lo = add(chart, LineSeries, { color: col, lineWidth:1, priceLineVisible:false })
        hi?.setData([{ time:t0, value:ob.high }, { time:tN, value:ob.high }])
        lo?.setData([{ time:t0, value:ob.low  }, { time:tN, value:ob.low  }])
        if (hi) seriesR.current[`ob_h_${idx}`] = hi
        if (lo) seriesR.current[`ob_l_${idx}`] = lo
      })
    }

    // RSI
    const rsiChart = chartsR.current.rsi
    if (rsiChart && showRSI) {
      const rsiVals = calcRSI(prices, 14)
      const rsiS = add(rsiChart, LineSeries, { color:'#2196f3', lineWidth:1.5, priceLineVisible:false })
      rsiS?.setData(candles.map((c,i) => rsiVals[i]!=null ? { time:c.time, value:rsiVals[i] } : null).filter(Boolean))
      if (rsiS) seriesR.current.rsiLine = rsiS
      const t0 = candles[0].time, tN = candles[candles.length-1].time
      ;[[70,'#ef535060'],[50,'#78869650'],[30,'#26a69a60']].forEach(([val, color]) => {
        const s = add(rsiChart, LineSeries, { color, lineWidth:1, lineStyle:2, priceLineVisible:false })
        s?.setData([{ time:t0, value:val }, { time:tN, value:val }])
      })
    }

    // MACD
    const macdChart = chartsR.current.macd
    if (macdChart && showMACD) {
      const { macdLine, signalLine, histogram } = calcMACD(prices, 12, 26, 9)
      const hist = add(macdChart, HistogramSeries, { priceLineVisible:false, base:0 })
      hist?.setData(candles.map((c,i) => ({ time:c.time, value:histogram[i], color:histogram[i]>=0?'#26a69a90':'#ef535090' })))
      const macdS = add(macdChart, LineSeries, { color:'#2196f3', lineWidth:1.2, priceLineVisible:false })
      macdS?.setData(candles.map((c,i) => ({ time:c.time, value:macdLine[i] })))
      const sigS = add(macdChart, LineSeries, { color:'#ff9800', lineWidth:1, priceLineVisible:false })
      sigS?.setData(candles.map((c,i) => ({ time:c.time, value:signalLine[i] })))
      if (hist) seriesR.current.macdHist = hist
      if (macdS) seriesR.current.macdLine = macdS
      if (sigS) seriesR.current.macdSig = sigS
    }

    // Volume
    const volChart = chartsR.current.vol
    if (volChart && showVolume) {
      const volS = add(volChart, HistogramSeries, { priceLineVisible:false, base:0 })
      volS?.setData(candles.map(c => ({ time:c.time, value:c.volume, color:c.close>=c.open?'#26a69a60':'#ef535060' })))
      if (volS) seriesR.current.vol = volS
    }

    // Sync scroll
    try {
      chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
        if (!range) return
        try { rsiChart?.timeScale().setVisibleLogicalRange(range)  } catch(_) {}
        try { macdChart?.timeScale().setVisibleLogicalRange(range) } catch(_) {}
        try { volChart?.timeScale().setVisibleLogicalRange(range)  } catch(_) {}
      })
    } catch(_) {}

    try { chart.timeScale().fitContent() } catch(_) {}

  }, [candles, chartType, indicators, showBB, showOB, showVWAP, showRSI, showMACD, showVolume])

  const panel = (ref, label, h) => (
    <div style={{ height:h, borderTop:'1px solid #2a2e39', flexShrink:0, position:'relative' }}>
      <span style={{ position:'absolute', top:3, left:8, fontSize:10, color:'#787b86', zIndex:2, pointerEvents:'none', fontFamily:"'JetBrains Mono',monospace" }}>
        {label}
      </span>
      <div ref={ref} style={{ width:'100%', height:'100%' }} />
    </div>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', flex:1, overflow:'hidden', minHeight:0 }}>
      <div ref={mainRef} style={{ flex:1, minHeight:0 }} />
      {panel(rsiRef,  'RSI (14)',       82)}
      {panel(macdRef, 'MACD (12,26,9)', 72)}
      {panel(volRef,  'Volume',         58)}
    </div>
  )
}
