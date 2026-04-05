import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { useAuth } from './auth'

export const useAlerts = create((set, get) => ({
  alerts: [],
  loading: false,

  load: async () => {
    const user = useAuth.getState().user
    if (!user) return
    set({ loading: true })
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', user.id)
      .eq('active', true)
      .order('created_at', { ascending: false })
    set({ alerts: data || [], loading: false })
  },

  add: async (alert) => {
    const user = useAuth.getState().user
    if (!user) return
    const { data, error } = await supabase.from('alerts').insert({
      user_id: user.id,
      ...alert,
      active: true,
    }).select().single()
    if (!error && data) {
      set(s => ({ alerts: [data, ...s.alerts] }))
    }
    return { data, error }
  },

  remove: async (id) => {
    await supabase.from('alerts').update({ active: false }).eq('id', id)
    set(s => ({ alerts: s.alerts.filter(a => a.id !== id) }))
  },

  toggle: async (id) => {
    const alert = get().alerts.find(a => a.id === id)
    if (!alert) return
    const newActive = !alert.active
    await supabase.from('alerts').update({ active: newActive }).eq('id', id)
    set(s => ({ alerts: s.alerts.map(a => a.id === id ? { ...a, active: newActive } : a) }))
  },

  // Check if any alert is triggered (called on every tick)
  checkTriggers: (symbol, price) => {
    const { alerts } = get()
    const triggered = alerts.filter(a =>
      a.symbol === symbol && a.active && !a.triggered_at &&
      ((a.condition === 'above' && price >= a.price) ||
       (a.condition === 'below' && price <= a.price))
    )
    triggered.forEach(async (alert) => {
      // Mark as triggered
      await supabase.from('alerts').update({ triggered_at: new Date().toISOString() }).eq('id', alert.id)
      set(s => ({ alerts: s.alerts.map(a => a.id === alert.id ? { ...a, triggered_at: new Date().toISOString() } : a) }))

      // Browser notification
      if (alert.notify_push && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(`🔔 Aureus TV — ${alert.symbol}`, {
          body: alert.condition === 'above'
            ? `Prix au-dessus de ${alert.price} : ${price.toFixed(2)}`
            : `Prix en-dessous de ${alert.price} : ${price.toFixed(2)}`,
          icon: '/favicon.ico'
        })
      }
    })
  },

  // Local demo alerts (no Supabase)
  localAlerts: [
    { id: 'demo1', symbol: 'XAUUSD', condition: 'above', price: 2350, message: 'XAUUSD > 2350', active: true, notify_email: true, notify_push: true, triggered_at: null },
    { id: 'demo2', symbol: 'BTCUSD', condition: 'below', price: 65000, message: 'BTC < 65K', active: true, notify_email: false, notify_push: true, triggered_at: null },
  ],
}))
