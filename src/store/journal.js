import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth'

export const TRADE_STATUSES = ['open', 'closed', 'cancelled']
export const TRADE_DIRECTIONS = ['long', 'short']
export const TRADE_SETUPS = ['OB Bullish', 'OB Bearish', 'FVG Fill', 'BOS', 'CHOCH', 'EMA Bounce', 'Fibonacci', 'Liquidation', 'Autre']
export const TRADE_EMOTIONS = ['confiant', 'hésitant', 'FOMO', 'revenge', 'patient', 'stressé', 'neutre']

// Mock trades pour demo
const MOCK_TRADES = [
  { id: 't1', symbol: 'XAUUSD', direction: 'long', setup: 'OB Bullish', entry: 2318.50, sl: 2312.00, tp1: 2338.00, tp2: 2355.00, lots: 0.5, status: 'closed', pnl: 487.50, rr: 3.2, emotion: 'confiant', notes: 'Bull OB H1 intact, confluence EMA 20. Entrée propre sur le retour.', screenshots: [], date: '2026-04-04T09:15:00', closedAt: '2026-04-04T14:32:00', closePrice: 2338.00, duration: '5h17' },
  { id: 't2', symbol: 'BTCUSD', direction: 'long', setup: 'FVG Fill', entry: 67200, sl: 66500, tp1: 68500, tp2: 70000, lots: 0.1, status: 'closed', pnl: -70.00, rr: 1.8, emotion: 'FOMO', notes: 'Entrée prématurée. FVG pas encore atteint. Stop touché.', screenshots: [], date: '2026-04-03T15:20:00', closedAt: '2026-04-03T16:45:00', closePrice: 66500, duration: '1h25' },
  { id: 't3', symbol: 'EURUSD', direction: 'short', setup: 'OB Bearish', entry: 1.0875, sl: 1.0900, tp1: 1.0840, tp2: 1.0810, lots: 1.0, status: 'open', pnl: 120.00, rr: 2.8, emotion: 'patient', notes: 'Bear OB H4. Structure baissière. En cours.', screenshots: [], date: '2026-04-05T07:30:00', closedAt: null, closePrice: null, duration: null },
  { id: 't4', symbol: 'XAUUSD', direction: 'short', setup: 'CHOCH', entry: 2361.00, sl: 2368.00, tp1: 2345.00, tp2: 2330.00, lots: 0.3, status: 'closed', pnl: 234.00, rr: 2.3, emotion: 'confiant', notes: 'CHOCH confirmé sur H1 après rejection du Bear OB H4.', screenshots: [], date: '2026-04-02T11:00:00', closedAt: '2026-04-02T18:20:00', closePrice: 2345.00, duration: '7h20' },
  { id: 't5', symbol: 'NAS100', direction: 'long', setup: 'EMA Bounce', entry: 18180, sl: 18050, tp1: 18320, tp2: 18500, lots: 0.2, status: 'closed', pnl: -260.00, rr: 1.1, emotion: 'revenge', notes: 'Trade revenge après perte sur BTC. Contre le bias daily. Erreur.', screenshots: [], date: '2026-04-01T14:00:00', closedAt: '2026-04-01T15:30:00', closePrice: 18050, duration: '1h30' },
]

export const useJournal = create((set, get) => ({
  trades: MOCK_TRADES,
  loading: false,
  filter: 'all', // all | open | closed | long | short
  sortBy: 'date_desc',

  setFilter: (v) => set({ filter: v }),
  setSortBy: (v) => set({ sortBy: v }),

  load: async () => {
    const user = useAuth.getState().user
    if (!user) return
    set({ loading: true })
    const { data } = await supabase.from('trades').select('*').eq('user_id', user.id).order('date', { ascending: false })
    if (data?.length) set({ trades: data })
    set({ loading: false })
  },

  addTrade: async (trade) => {
    const user = useAuth.getState().user
    const newTrade = { ...trade, id: `t${Date.now()}`, date: new Date().toISOString(), pnl: 0 }
    if (user) {
      const { data } = await supabase.from('trades').insert({ ...newTrade, user_id: user.id }).select().single()
      if (data) { set(s => ({ trades: [data, ...s.trades] })); return }
    }
    set(s => ({ trades: [newTrade, ...s.trades] }))
  },

  closeTrade: async (id, closePrice) => {
    const trade = get().trades.find(t => t.id === id)
    if (!trade) return
    const pips = trade.direction === 'long' ? closePrice - trade.entry : trade.entry - closePrice
    const pnl = pips * trade.lots * (trade.symbol === 'XAUUSD' ? 100 : trade.symbol.includes('USD') ? 10000 : 100)
    const update = { status: 'closed', closePrice, closedAt: new Date().toISOString(), pnl: Math.round(pnl * 100) / 100, duration: '—' }
    const user = useAuth.getState().user
    if (user) await supabase.from('trades').update(update).eq('id', id)
    set(s => ({ trades: s.trades.map(t => t.id === id ? { ...t, ...update } : t) }))
  },

  deleteTrade: async (id) => {
    const user = useAuth.getState().user
    if (user) await supabase.from('trades').delete().eq('id', id)
    set(s => ({ trades: s.trades.filter(t => t.id !== id) }))
  },

  updateTrade: async (id, changes) => {
    const user = useAuth.getState().user
    if (user) await supabase.from('trades').update(changes).eq('id', id)
    set(s => ({ trades: s.trades.map(t => t.id === id ? { ...t, ...changes } : t) }))
  },

  // Stats calculées
  getStats: () => {
    const { trades } = get()
    const closed = trades.filter(t => t.status === 'closed')
    if (!closed.length) return { winRate: 0, totalPnL: 0, avgRR: 0, wins: 0, losses: 0, totalTrades: 0, bestTrade: 0, worstTrade: 0, avgWin: 0, avgLoss: 0, profitFactor: 0 }
    const wins = closed.filter(t => t.pnl > 0)
    const losses = closed.filter(t => t.pnl <= 0)
    const totalPnL = closed.reduce((a, t) => a + (t.pnl || 0), 0)
    const avgRR = closed.reduce((a, t) => a + (t.rr || 0), 0) / closed.length
    const grossWin = wins.reduce((a, t) => a + t.pnl, 0)
    const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0))
    return {
      winRate: Math.round((wins.length / closed.length) * 100),
      totalPnL: Math.round(totalPnL * 100) / 100,
      avgRR: Math.round(avgRR * 10) / 10,
      wins: wins.length,
      losses: losses.length,
      totalTrades: closed.length,
      bestTrade: Math.max(...closed.map(t => t.pnl || 0)),
      worstTrade: Math.min(...closed.map(t => t.pnl || 0)),
      avgWin: wins.length ? Math.round(grossWin / wins.length * 100) / 100 : 0,
      avgLoss: losses.length ? Math.round(grossLoss / losses.length * 100) / 100 : 0,
      profitFactor: grossLoss > 0 ? Math.round((grossWin / grossLoss) * 100) / 100 : 0,
      bySetup: TRADE_SETUPS.map(s => ({ setup: s, count: closed.filter(t => t.setup === s).length, pnl: closed.filter(t => t.setup === s).reduce((a, t) => a + t.pnl, 0) })).filter(s => s.count > 0),
      byEmotion: TRADE_EMOTIONS.map(e => ({ emotion: e, count: closed.filter(t => t.emotion === e).length, winRate: (() => { const et = closed.filter(t => t.emotion === e); return et.length ? Math.round(et.filter(t => t.pnl > 0).length / et.length * 100) : 0 })() })).filter(e => e.count > 0),
    }
  }
}))
