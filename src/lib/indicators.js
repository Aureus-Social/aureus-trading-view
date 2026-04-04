// Aureus Trading View — Indicateurs techniques
// Sources: technicalindicators + calculs custom SMC

export function calcEMA(prices, period) {
  const k = 2 / (period + 1)
  let ema = prices[0]
  return prices.map(p => { ema = p * k + ema * (1 - k); return ema })
}

export function calcSMA(prices, period) {
  return prices.map((_, i) => {
    if (i < period - 1) return null
    const slice = prices.slice(i - period + 1, i + 1)
    return slice.reduce((a, b) => a + b, 0) / period
  })
}

export function calcWMA(prices, period) {
  return prices.map((_, i) => {
    if (i < period - 1) return null
    let num = 0, den = 0
    for (let j = 0; j < period; j++) { num += prices[i - j] * (period - j); den += (period - j) }
    return num / den
  })
}

export function calcRSI(prices, period = 14) {
  const rsi = []
  for (let i = 0; i < prices.length; i++) {
    if (i < period) { rsi.push(null); continue }
    let gains = 0, losses = 0
    for (let j = i - period + 1; j <= i; j++) {
      const d = prices[j] - prices[j - 1]
      if (d > 0) gains += d; else losses -= d
    }
    const rs = losses === 0 ? 100 : gains / losses
    rsi.push(100 - (100 / (1 + rs)))
  }
  return rsi
}

export function calcMACD(prices, fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(prices, fast)
  const emaSlow = calcEMA(prices, slow)
  const macdLine = emaFast.map((v, i) => v - emaSlow[i])
  const signalLine = calcEMA(macdLine, signal)
  const histogram = macdLine.map((v, i) => v - signalLine[i])
  return { macdLine, signalLine, histogram }
}

export function calcBollingerBands(prices, period = 20, mult = 2) {
  const sma = calcSMA(prices, period)
  return prices.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null }
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = sma[i]
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / period)
    return { upper: mean + mult * std, middle: mean, lower: mean - mult * std }
  })
}

export function calcATR(candles, period = 14) {
  const tr = candles.map((c, i) => {
    if (i === 0) return c.high - c.low
    const prev = candles[i - 1]
    return Math.max(c.high - c.low, Math.abs(c.high - prev.close), Math.abs(c.low - prev.close))
  })
  return calcEMA(tr, period)
}

export function calcStochastic(candles, kPeriod = 14, dPeriod = 3) {
  const kLine = candles.map((_, i) => {
    if (i < kPeriod - 1) return null
    const slice = candles.slice(i - kPeriod + 1, i + 1)
    const highest = Math.max(...slice.map(c => c.high))
    const lowest = Math.min(...slice.map(c => c.low))
    return ((candles[i].close - lowest) / (highest - lowest)) * 100
  })
  const dLine = calcSMA(kLine.filter(v => v !== null), dPeriod)
  return { kLine, dLine }
}

export function calcVWAP(candles) {
  let cumVP = 0, cumV = 0
  return candles.map(c => {
    const tp = (c.high + c.low + c.close) / 3
    cumVP += tp * c.volume
    cumV += c.volume
    return cumVP / cumV
  })
}

// SMC — Order Blocks detection
export function detectOrderBlocks(candles, lookback = 10) {
  const obs = []
  for (let i = lookback; i < candles.length - 2; i++) {
    const cur = candles[i]
    const next = candles[i + 1]
    const prev = candles.slice(i - lookback, i)

    // Bullish OB: bearish candle before strong bullish move
    if (cur.close < cur.open && next.close > next.open) {
      const move = (next.close - next.open) / next.open
      if (move > 0.001) {
        obs.push({ type: 'bull', high: cur.high, low: cur.low, index: i, intact: true })
      }
    }
    // Bearish OB: bullish candle before strong bearish move
    if (cur.close > cur.open && next.close < next.open) {
      const move = (next.open - next.close) / next.open
      if (move > 0.001) {
        obs.push({ type: 'bear', high: cur.high, low: cur.low, index: i, intact: true })
      }
    }
  }
  // Mark as mitigated if price returned into OB
  const lastClose = candles[candles.length - 1].close
  return obs.map(ob => ({
    ...ob,
    intact: ob.type === 'bull' ? lastClose > ob.low : lastClose < ob.high
  })).slice(-8) // Keep last 8 OBs
}

// SMC — Fair Value Gaps
export function detectFVG(candles) {
  const fvgs = []
  for (let i = 1; i < candles.length - 1; i++) {
    const prev = candles[i - 1]
    const next = candles[i + 1]
    // Bullish FVG: gap between prev high and next low
    if (next.low > prev.high) {
      fvgs.push({ type: 'bull', top: next.low, bottom: prev.high, index: i })
    }
    // Bearish FVG: gap between next high and prev low
    if (next.high < prev.low) {
      fvgs.push({ type: 'bear', top: prev.low, bottom: next.high, index: i })
    }
  }
  return fvgs.slice(-6)
}

// SMC — BOS/CHOCH
export function detectStructure(candles, lookback = 20) {
  const swingHighs = [], swingLows = []
  for (let i = lookback; i < candles.length - lookback; i++) {
    const slice = candles.slice(i - lookback, i + lookback)
    if (candles[i].high === Math.max(...slice.map(c => c.high)))
      swingHighs.push({ price: candles[i].high, index: i })
    if (candles[i].low === Math.min(...slice.map(c => c.low)))
      swingLows.push({ price: candles[i].low, index: i })
  }
  return { swingHighs: swingHighs.slice(-5), swingLows: swingLows.slice(-5) }
}

// Heikin Ashi conversion
export function toHeikinAshi(candles) {
  return candles.map((c, i) => {
    const haClose = (c.open + c.high + c.low + c.close) / 4
    const haOpen = i === 0 ? (c.open + c.close) / 2
      : (candles[i - 1].open + candles[i - 1].close) / 2
    const haHigh = Math.max(c.high, haOpen, haClose)
    const haLow = Math.min(c.low, haOpen, haClose)
    return { ...c, open: haOpen, high: haHigh, low: haLow, close: haClose }
  })
}

// Generate mock OHLCV data (replaced by Polygon.io in prod)
export function generateMockCandles(n = 200, basePrice = 2320, symbol = 'XAUUSD') {
  const candles = []
  let price = basePrice
  const now = Math.floor(Date.now() / 1000)
  const interval = 3600 // 1H

  for (let i = n; i >= 0; i--) {
    const open = price + (Math.random() - 0.48) * 8
    const close = open + (Math.random() - 0.47) * 14
    const high = Math.max(open, close) + Math.random() * 6
    const low = Math.min(open, close) - Math.random() * 6
    const volume = 20000 + Math.random() * 80000
    const time = now - i * interval

    candles.push({ time, open, high, low, close, volume })
    price = close
  }
  return candles
}

// Simulate live price tick
export function simulateTick(lastCandle) {
  const change = (Math.random() - 0.499) * 0.8
  const newClose = lastCandle.close + change
  return {
    ...lastCandle,
    close: newClose,
    high: Math.max(lastCandle.high, newClose),
    low: Math.min(lastCandle.low, newClose),
    volume: lastCandle.volume + Math.random() * 500
  }
}
