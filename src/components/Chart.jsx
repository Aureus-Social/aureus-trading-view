import { useEffect, useRef, useCallback } from 'react'
import {
  createChart, CandlestickSeries, BarSeries, LineSeries,
  AreaSeries, HistogramSeries
} from 'lightweight-charts'
import { useStore } from '../store'
import {
  calcEMA, calcSMA, calcWMA, calcRSI, calcMACD, calcBollingerBands,
  calcATR, calcVWAP, detectOrderBlocks, detectFVG, toHeikinAshi
} from '../lib/indicators'

export default function Chart() {
  const containerRef = useRef(null)
  const rsiRef = useRef(null)
  const macdRef = useRef(null)
  const volRef = useRef(null)

  const chartRef = useRef(null)
  const rsiChartRef = useRef(null)
  const macdChartRef = useRef(null)
  const volChartRef = useRef(null)

  const seriesRef = useRef({})

  const {
    candles, chartType, colors, indicators,
    showRSI, showMACD, showVolume, showBB, showOB, showFVG, showVWAP
  } = useStore()

  const getChartOptions = useCallback(() => ({
    layout: {
      background: { type: 'solid', color: colors.background },
      textColor: colors.text,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11,
    },
    grid: {
      vertLines: { color: colors.grid, style: 1 },
      horzLines: { color: colors.grid, style: 1 },
    },
    crosshair: {
      mode: 1,
      vertLine: { color: colors.crosshair, width: 1, style: 3, labelBackgroundColor: '#2962ff' },
      horzLine: { color: colors.crosshair, width: 1, style: 3, labelBackgroundColor: '#2962ff' },
    },
    rightPriceScale: { borderColor: colors.grid, textColor: colors.text },
    timeScale: { borderColor: colors.grid, textColor: colors.text, timeVisible: true, secondsVisible: false },
    handleScroll: { mouseWheel: true, pressedMouseMove: true },
    handleScale: { mouseWheel: true, pinch: true },
  }), [colors])

  // Init charts
  useEffect(() => {
    if (!containerRef.current) return

    // Main chart
    chartRef.current = createChart(containerRef.current, {
      ...getChartOptions(),
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    })

    // RSI pane
    if (rsiRef.current && showRSI) {
      rsiChartRef.current = createChart(rsiRef.current, {
        ...getChartOptions(),
        width: rsiRef.current.offsetWidth,
        height: rsiRef.current.offsetHeight,
        timeScale: { visible: false },
      })
    }

    // MACD pane
    if (macdRef.current && showMACD) {
      macdChartRef.current = createChart(macdRef.current, {
        ...getChartOptions(),
        width: macdRef.current.offsetWidth,
        height: macdRef.current.offsetHeight,
        timeScale: { visible: false },
      })
    }

    // Volume pane
    if (volRef.current && showVolume) {
      volChartRef.current = createChart(volRef.current, {
        ...getChartOptions(),
        width: volRef.current.offsetWidth,
        height: volRef.current.offsetHeight,
        timeScale: { visible: false },
      })
    }

    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        })
      }
    })
    if (containerRef.current) resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      chartRef.current?.remove()
      rsiChartRef.current?.remove()
      macdChartRef.current?.remove()
      volChartRef.current?.remove()
      chartRef.current = null
    }
  }, [])

  // Update data & indicators
  useEffect(() => {
    if (!chartRef.current || !candles.length) return
    const chart = chartRef.current

    // Remove old series
    Object.values(seriesRef.current).forEach(s => {
      try { chart.removeSeries(s) } catch (e) {}
    })
    seriesRef.current = {}

    const prices = candles.map(c => c.close)
    let displayCandles = [...candles]
    if (chartType === 'heikinashi') displayCandles = toHeikinAshi(candles)

    // Main series
    let mainSeries
    if (chartType === 'line') {
      mainSeries = chart.addSeries(LineSeries, {
        color: colors.upCandle, lineWidth: 2,
      })
      mainSeries.setData(displayCandles.map(c => ({ time: c.time, value: c.close })))
    } else if (chartType === 'area') {
      mainSeries = chart.addSeries(AreaSeries, {
        lineColor: colors.upCandle,
        topColor: colors.upCandle + '40',
        bottomColor: colors.upCandle + '05',
        lineWidth: 2,
      })
      mainSeries.setData(displayCandles.map(c => ({ time: c.time, value: c.close })))
    } else if (chartType === 'bar') {
      mainSeries = chart.addSeries(BarSeries, {
        upColor: colors.upCandle, downColor: colors.downCandle,
      })
      mainSeries.setData(displayCandles)
    } else {
      // candlestick + heikinashi
      mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: colors.upCandle,
        downColor: colors.downCandle,
        borderUpColor: colors.upCandle,
        borderDownColor: colors.downCandle,
        wickUpColor: colors.upWick,
        wickDownColor: colors.downWick,
        borderVisible: chartType === 'hollow',
      })
      if (chartType === 'hollow') {
        mainSeries.applyOptions({
          upColor: 'transparent', downColor: 'transparent',
        })
      }
      mainSeries.setData(displayCandles)
    }
    seriesRef.current.main = mainSeries

    // EMA / SMA / WMA indicators
    indicators.filter(i => i.visible).forEach(ind => {
      let vals
      if (ind.type === 'EMA') vals = calcEMA(prices, ind.period)
      else if (ind.type === 'SMA') vals = calcSMA(prices, ind.period)
      else if (ind.type === 'WMA') vals = calcWMA(prices, ind.period)
      else return

      const series = chart.addSeries(LineSeries, {
        color: ind.color, lineWidth: ind.width || 1.5, priceLineVisible: false,
      })
      series.setData(candles.map((c, i) => vals[i] !== null ? { time: c.time, value: vals[i] } : null).filter(Boolean))
      seriesRef.current[`ind_${ind.id}`] = series
    })

    // Bollinger Bands
    if (showBB) {
      const bb = calcBollingerBands(prices, 20, 2)
      const bbUpper = chart.addSeries(LineSeries, { color: '#9c27b080', lineWidth: 1, priceLineVisible: false })
      const bbMiddle = chart.addSeries(LineSeries, { color: '#9c27b050', lineWidth: 1, lineStyle: 2, priceLineVisible: false })
      const bbLower = chart.addSeries(LineSeries, { color: '#9c27b080', lineWidth: 1, priceLineVisible: false })
      bbUpper.setData(candles.map((c, i) => bb[i].upper ? { time: c.time, value: bb[i].upper } : null).filter(Boolean))
      bbMiddle.setData(candles.map((c, i) => bb[i].middle ? { time: c.time, value: bb[i].middle } : null).filter(Boolean))
      bbLower.setData(candles.map((c, i) => bb[i].lower ? { time: c.time, value: bb[i].lower } : null).filter(Boolean))
      seriesRef.current.bbU = bbUpper
      seriesRef.current.bbM = bbMiddle
      seriesRef.current.bbL = bbLower
    }

    // VWAP
    if (showVWAP) {
      const vwap = calcVWAP(candles)
      const vwapSeries = chart.addSeries(LineSeries, { color: '#00bcd4', lineWidth: 1.5, lineStyle: 2, priceLineVisible: false })
      vwapSeries.setData(candles.map((c, i) => ({ time: c.time, value: vwap[i] })))
      seriesRef.current.vwap = vwapSeries
    }

    // Order Blocks (drawn as price lines)
    if (showOB) {
      const obs = detectOrderBlocks(candles)
      obs.forEach((ob, idx) => {
        const obHigh = chart.addSeries(LineSeries, {
          color: ob.type === 'bull' ? '#26a69a40' : '#ef535040',
          lineWidth: 1, priceLineVisible: false, lineStyle: 0,
        })
        const obLow = chart.addSeries(LineSeries, {
          color: ob.type === 'bull' ? '#26a69a40' : '#ef535040',
          lineWidth: 1, priceLineVisible: false, lineStyle: 0,
        })
        const fromTime = candles[ob.index]?.time
        const toTime = candles[candles.length - 1]?.time
        if (fromTime && toTime) {
          obHigh.setData([{ time: fromTime, value: ob.high }, { time: toTime, value: ob.high }])
          obLow.setData([{ time: fromTime, value: ob.low }, { time: toTime, value: ob.low }])
        }
        seriesRef.current[`ob_h_${idx}`] = obHigh
        seriesRef.current[`ob_l_${idx}`] = obLow
      })
    }

    // Sync timescale scroll across panes
    chart.timeScale().subscribeVisibleLogicalRangeChange(range => {
      rsiChartRef.current?.timeScale().setVisibleLogicalRange(range)
      macdChartRef.current?.timeScale().setVisibleLogicalRange(range)
      volChartRef.current?.timeScale().setVisibleLogicalRange(range)
    })

    // RSI pane
    if (rsiChartRef.current) {
      try { rsiChartRef.current.removeSeries(seriesRef.current.rsi) } catch (e) {}
      const rsiVals = calcRSI(prices, 14)
      const rsiSeries = rsiChartRef.current.addSeries(LineSeries, {
        color: '#2196f3', lineWidth: 1.5, priceLineVisible: false,
      })
      rsiSeries.setData(candles.map((c, i) => rsiVals[i] !== null ? { time: c.time, value: rsiVals[i] } : null).filter(Boolean))
      seriesRef.current.rsi = rsiSeries

      // OB/OS lines
      const ob70 = rsiChartRef.current.addSeries(LineSeries, { color: '#ef535060', lineWidth: 1, lineStyle: 2, priceLineVisible: false })
      const os30 = rsiChartRef.current.addSeries(LineSeries, { color: '#26a69a60', lineWidth: 1, lineStyle: 2, priceLineVisible: false })
      const mid50 = rsiChartRef.current.addSeries(LineSeries, { color: '#78869660', lineWidth: 1, lineStyle: 3, priceLineVisible: false })
      const d = [{ time: candles[0].time, value: 0 }, { time: candles[candles.length - 1].time, value: 0 }]
      ob70.setData(d.map(p => ({ ...p, value: 70 })))
      os30.setData(d.map(p => ({ ...p, value: 30 })))
      mid50.setData(d.map(p => ({ ...p, value: 50 })))
      seriesRef.current.rsiOB = ob70
      seriesRef.current.rsiOS = os30
      seriesRef.current.rsiMid = mid50
    }

    // MACD pane
    if (macdChartRef.current) {
      try { macdChartRef.current.removeSeries(seriesRef.current.macdLine) } catch (e) {}
      try { macdChartRef.current.removeSeries(seriesRef.current.macdSig) } catch (e) {}
      try { macdChartRef.current.removeSeries(seriesRef.current.macdHist) } catch (e) {}

      const { macdLine, signalLine, histogram } = calcMACD(prices, 12, 26, 9)

      const histSeries = macdChartRef.current.addSeries(HistogramSeries, {
        color: '#26a69a', priceLineVisible: false,
        base: 0,
      })
      histSeries.setData(candles.map((c, i) => ({
        time: c.time, value: histogram[i],
        color: histogram[i] >= 0 ? '#26a69a90' : '#ef535090'
      })))

      const macdSeries = macdChartRef.current.addSeries(LineSeries, { color: '#2196f3', lineWidth: 1.2, priceLineVisible: false })
      const sigSeries = macdChartRef.current.addSeries(LineSeries, { color: '#ff9800', lineWidth: 1, priceLineVisible: false })

      macdSeries.setData(candles.map((c, i) => ({ time: c.time, value: macdLine[i] })))
      sigSeries.setData(candles.map((c, i) => ({ time: c.time, value: signalLine[i] })))

      seriesRef.current.macdLine = macdSeries
      seriesRef.current.macdSig = sigSeries
      seriesRef.current.macdHist = histSeries
    }

    // Volume pane
    if (volChartRef.current) {
      try { volChartRef.current.removeSeries(seriesRef.current.vol) } catch (e) {}
      const volSeries = volChartRef.current.addSeries(HistogramSeries, {
        priceLineVisible: false, base: 0,
      })
      volSeries.setData(candles.map(c => ({
        time: c.time, value: c.volume,
        color: c.close >= c.open ? '#26a69a60' : '#ef535060'
      })))
      seriesRef.current.vol = volSeries
    }

    chart.timeScale().fitContent()

  }, [candles, chartType, colors, indicators, showBB, showOB, showFVG, showVWAP])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      <div ref={containerRef} style={{ flex: 1 }} />
      {showRSI && (
        <div style={{ height: 80, borderTop: '1px solid #2a2e39', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: 8, fontSize: 10, color: '#787b86', zIndex: 2, pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace' }}>
            RSI (14)
          </div>
          <div ref={rsiRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
      {showMACD && (
        <div style={{ height: 70, borderTop: '1px solid #2a2e39', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: 8, fontSize: 10, color: '#787b86', zIndex: 2, pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace' }}>
            MACD (12, 26, 9)
          </div>
          <div ref={macdRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
      {showVolume && (
        <div style={{ height: 55, borderTop: '1px solid #2a2e39', position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 3, left: 8, fontSize: 10, color: '#787b86', zIndex: 2, pointerEvents: 'none', fontFamily: 'JetBrains Mono, monospace' }}>
            Volume
          </div>
          <div ref={volRef} style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </div>
  )
}
