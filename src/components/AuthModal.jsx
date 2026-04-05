import { useState } from 'react'
import { useAuth } from '../store/auth'

const gold = '#c6a34e'
const bg = '#1a1e2d'
const border = '#2a2e39'

function Input({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#787b86', marginBottom: 5, fontFamily: 'JetBrains Mono, monospace' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: '#131722', border: `1px solid ${border}`,
          borderRadius: 4, color: '#d1d4dc', fontSize: 13, padding: '9px 12px',
          fontFamily: 'JetBrains Mono, monospace', outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = '#2962ff'}
        onBlur={e => e.target.style.borderColor = border}
      />
    </div>
  )
}

export default function AuthModal() {
  const { authModal, setAuthModal, login, register, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!authModal) return null

  const handleSubmit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (authModal === 'login') {
        await login(email, password)
        setAuthModal(null)
      } else if (authModal === 'register') {
        await register(email, password, name)
        setSuccess('Compte créé ! Vérifie ton email pour confirmer.')
      } else if (authModal === 'reset') {
        await resetPassword(email)
        setSuccess('Email de réinitialisation envoyé.')
      }
    } catch (e) {
      setError(e.message || 'Erreur inattendue')
    }
    setLoading(false)
  }

  const titles = { login: 'Connexion', register: 'Créer un compte', reset: 'Mot de passe oublié' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, width: 380, padding: 28, fontFamily: 'JetBrains Mono, monospace' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
              <path d="M9 1L16 15H2Z" fill={gold}/>
            </svg>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>{titles[authModal]}</span>
          </div>
          <button onClick={() => setAuthModal(null)} style={{ background: 'none', border: 'none', color: '#787b86', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {/* Form */}
        {authModal === 'register' && (
          <Input label="Nom complet" value={name} onChange={setName} placeholder="Nourdin Moussati" />
        )}
        <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        {authModal !== 'reset' && (
          <Input label="Mot de passe" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        )}

        {/* Error / Success */}
        {error && (
          <div style={{ background: '#ef535020', border: '1px solid #ef535040', borderRadius: 4, padding: '8px 12px', fontSize: 11, color: '#ef5350', marginBottom: 14 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#26a69a20', border: '1px solid #26a69a40', borderRadius: 4, padding: '8px 12px', fontSize: 11, color: '#26a69a', marginBottom: 14 }}>
            {success}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', background: '#2962ff', border: 'none', borderRadius: 4, color: '#fff', fontSize: 13, fontWeight: 600, padding: '10px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'JetBrains Mono, monospace' }}
        >
          {loading ? 'Chargement...' : titles[authModal]}
        </button>

        {/* Links */}
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
          {authModal === 'login' && (
            <>
              <button onClick={() => { setAuthModal('reset'); setError('') }} style={{ background: 'none', border: 'none', color: '#787b86', fontSize: 11, cursor: 'pointer' }}>
                Mot de passe oublié ?
              </button>
              <button onClick={() => { setAuthModal('register'); setError('') }} style={{ background: 'none', border: 'none', color: gold, fontSize: 11, cursor: 'pointer' }}>
                Pas de compte ? Créer un compte →
              </button>
            </>
          )}
          {authModal === 'register' && (
            <button onClick={() => { setAuthModal('login'); setError('') }} style={{ background: 'none', border: 'none', color: '#787b86', fontSize: 11, cursor: 'pointer' }}>
              Déjà un compte ? Se connecter
            </button>
          )}
          {authModal === 'reset' && (
            <button onClick={() => { setAuthModal('login'); setError('') }} style={{ background: 'none', border: 'none', color: '#787b86', fontSize: 11, cursor: 'pointer' }}>
              ← Retour à la connexion
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
