import { create } from 'zustand'

export const SYMBOLS = [
  { symbol: 'XAUUSD', name: 'Gold / US Dollar', category: 'metals', base: 2320 },
  { symbol: 'BTCUSD', name: 'Bitcoin / USD', category: 'crypto', base: 67500 },
  { symbol: 'ETHUSD', name: 'Ethereum / USD', category: 'crypto', base: 3180 },
  { symbol: 'EURUSD', name: 'Euro / US Dollar', category: 'forex', base: 1.0842 },
  { symbol: 'GBPUSD', name: 'Pound / US Dollar', category: 'forex', base: 1.2634 },
  { symbol: 'USDJPY', name: 'US Dollar / Yen', category: 'forex', base: 151.42 },
  { symbol: 'USDCHF', name: 'US Dollar / Franc', category: 'forex', base: 0.9012 },
  { symbol: 'AUDUSD', name: 'AUD / USD', category: 'forex', base: 0.6542 },
  { symbol: 'USDCAD', name: 'USD / CAD', category: 'forex', base: 1.3621 },
  { symbol: 'NAS100', name: 'Nasdaq 100', category: 'indices', base: 18240 },
  { symbol: 'SPX500', name: 'S&P 500', category: 'indices', base: 5218 },
  { symbol: 'US30', name: 'Dow Jones', category: 'indices', base: 38900 },
  { symbol: 'GER40', name: 'DAX 40', category: 'indices', base: 18120 },
  { symbol: 'USOIL', name: 'Crude Oil WTI', category: 'commodities', base: 82.14 },
  { symbol: 'XAGUSD', name: 'Silver / USD', category: 'metals', base: 28.42 },
]

export const TIMEFRAMES = [
  { label: '1s', seconds: 1 },
  { label: '5s', seconds: 5 },
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '15m', seconds: 900 },
  { label: '1H', seconds: 3600 },
  { label: '4H', seconds: 14400 },
  { label: '1D', seconds: 86400 },
  { label: '1W', seconds: 604800 },
]

export const CHART_TYPES = [
  { id: 'candlestick', label: 'Chandeliers' },
  { id: 'heikinashi', label: 'Heikin Ashi' },
  { id: 'bar', label: 'OHLC Barres' },
  { id: 'line', label: 'Ligne' },
  { id: 'area', label: 'Aire' },
  { id: 'hollow', label: 'Hollow' },
]

export const DEFAULT_COLORS = {
  background: '#131722',
  grid: '#1e222d',
  upCandle: '#26a69a',
  downCandle: '#ef5350',
  upWick: '#26a69a',
  downWick: '#ef5350',
  crosshair: '#758696',
  text: '#b2b5be',
}

export const DEFAULT_INDICATORS = [
  { id: 'ema1', type: 'EMA', period: 20, color: '#2196f3', width: 1.5, visible: true },
  { id: 'ema2', type: 'EMA', period: 50, color: '#ff9800', width: 1.5, visible: true },
  { id: 'ema3', type: 'EMA', period: 200, color: '#e91e63', width: 1.5, visible: true },
]

export const useStore = create((set, get) => ({
  // Chart state
  symbol: 'XAUUSD',
  timeframe: '1H',
  chartType: 'candlestick',
  candles: [],
  livePrice: null,
  priceChange: 0,
  priceChangePct: 0,

  // Colors
  colors: { ...DEFAULT_COLORS },

  // Indicators
  indicators: [...DEFAULT_INDICATORS],
  showRSI: true,
  showMACD: true,
  showVolume: true,
  showBB: false,
  showOB: true,
  showFVG: true,
  showFib: false,
  showVWAP: false,

  // UI state
  showSettings: false,
  showIndicatorModal: false,
  showSearch: false,
  searchQuery: '',
  activePanel: 'watchlist', // watchlist | ob | alerts

  // Watchlist
  watchlist: ['XAUUSD', 'BTCUSD', 'EURUSD', 'GBPUSD', 'NAS100', 'ETHUSD', 'SPX500', 'USDJPY', 'USOIL'],
  watchlistPrices: {},

  // Actions
  setSymbol: (symbol) => set({ symbol }),
  setTimeframe: (timeframe) => set({ timeframe }),
  setChartType: (chartType) => set({ chartType }),
  setCandles: (candles) => set({ candles }),
  setLivePrice: (price, change, pct) => set({ livePrice: price, priceChange: change, priceChangePct: pct }),
  setColor: (key, value) => set(s => ({ colors: { ...s.colors, [key]: value } })),
  toggleIndicator: (key) => set(s => ({ [key]: !s[key] })),
  setShowSettings: (v) => set({ showSettings: v }),
  setShowIndicatorModal: (v) => set({ showIndicatorModal: v }),
  setShowSearch: (v) => set({ showSearch: v }),
  setSearchQuery: (v) => set({ searchQuery: v }),
  setActivePanel: (v) => set({ activePanel: v }),

  addIndicator: (ind) => set(s => ({
    indicators: [...s.indicators, { ...ind, id: `ind_${Date.now()}` }]
  })),
  removeIndicator: (id) => set(s => ({
    indicators: s.indicators.filter(i => i.id !== id)
  })),
  updateIndicator: (id, changes) => set(s => ({
    indicators: s.indicators.map(i => i.id === id ? { ...i, ...changes } : i)
  })),

  updateWatchlistPrice: (symbol, price, change) => set(s => ({
    watchlistPrices: { ...s.watchlistPrices, [symbol]: { price, change } }
  })),
}))
