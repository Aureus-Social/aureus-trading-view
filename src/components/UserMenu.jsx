import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../store/auth'

const planColors = { free: '#787b86', pro: '#2962ff', premium: '#c6a34e' }
const planLabels = { free: 'Free', pro: 'Pro', premium: 'Premium' }

export default function UserMenu({ onOpenPricing }) {
  const { user, profile, logout, setAuthModal } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const plan = profile?.plan || 'free'
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?'

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 10 }}>
        <button onClick={() => setAuthModal('login')}
          style={{ background: 'transparent', border: '1px solid #2a2e39', borderRadius: 4, color: '#b2b5be', fontSize: 11, padding: '4px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
          Connexion
        </button>
        <button onClick={() => setAuthModal('register')}
          style={{ background: '#2962ff', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, padding: '4px 10px', cursor: 'pointer', fontFamily: 'JetBrains Mono, monospace' }}>
          S'inscrire
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position: 'relative', paddingRight: 10 }}>
      <div onClick={() => setOpen(!open)}
        style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer' }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: planColors[plan], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: plan === 'free' ? '#fff' : '#131722', fontFamily: 'JetBrains Mono, monospace' }}>
          {initials}
        </div>
        <div style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: `${planColors[plan]}20`, color: planColors[plan], fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
          {planLabels[plan]}
        </div>
      </div>

      {open && (
        <div style={{ position: 'absolute', top: 34, right: 0, background: '#1a1e2d', border: '1px solid #2a2e39', borderRadius: 6, width: 200, zIndex: 500, overflow: 'hidden', fontFamily: 'JetBrains Mono, monospace' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid #2a2e39' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#d1d4dc' }}>{profile?.full_name || 'Utilisateur'}</div>
            <div style={{ fontSize: 10, color: '#787b86', marginTop: 2 }}>{user.email}</div>
            <div style={{ marginTop: 6, display: 'inline-block', fontSize: 9, padding: '2px 8px', borderRadius: 10, background: `${planColors[plan]}20`, color: planColors[plan], fontWeight: 600 }}>
              Plan {planLabels[plan]}
            </div>
          </div>

          {[
            { label: 'Mon profil', icon: '👤', action: () => {} },
            { label: 'Mes alertes', icon: '🔔', action: () => {} },
            { label: 'Mes layouts', icon: '📐', action: () => {} },
            { label: 'Mettre à niveau', icon: '⚡', action: () => { onOpenPricing(); setOpen(false) }, color: '#c6a34e' },
          ].map(item => (
            <div key={item.label} onClick={item.action}
              style={{ padding: '9px 12px', fontSize: 12, color: item.color || '#b2b5be', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '0.5px solid #1e222d' }}
              onMouseEnter={e => e.currentTarget.style.background = '#2a2e39'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: 13 }}>{item.icon}</span> {item.label}
            </div>
          ))}

          <div onClick={() => { logout(); setOpen(false) }}
            style={{ padding: '9px 12px', fontSize: 12, color: '#ef5350', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            onMouseEnter={e => e.currentTarget.style.background = '#2a2e39'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <span style={{ fontSize: 13 }}>🚪</span> Déconnexion
          </div>
        </div>
      )}
    </div>
  )
}
