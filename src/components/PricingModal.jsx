import { useAuth } from '../store/auth'

// Stripe price IDs — à remplacer avec les vrais IDs depuis Stripe Dashboard
// https://dashboard.stripe.com/products
const STRIPE_LINKS = {
  pro_monthly: import.meta.env.VITE_STRIPE_PRO_LINK || 'https://buy.stripe.com/test_pro_monthly',
  pro_annual: import.meta.env.VITE_STRIPE_PRO_ANNUAL_LINK || 'https://buy.stripe.com/test_pro_annual',
  premium_monthly: import.meta.env.VITE_STRIPE_PREMIUM_LINK || 'https://buy.stripe.com/test_premium_monthly',
  premium_annual: import.meta.env.VITE_STRIPE_PREMIUM_ANNUAL_LINK || 'https://buy.stripe.com/test_premium_annual',
}

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceAnnual: 0,
    color: '#787b86',
    features: [
      '1 chart',
      '5 indicateurs max',
      'Watchlist 5 symboles',
      'Timeframes: 1m → 1D',
      'Données différées 15min',
      'Types de bougies de base',
    ],
    limits: [
      'Pas d\'Order Blocks',
      'Pas d\'alertes',
      'Pas de replay',
    ],
    cta: 'Gratuit',
    ctaAction: null,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceAnnual: 23,
    color: '#2962ff',
    popular: true,
    features: [
      '4 charts simultanés',
      'Indicateurs illimités',
      'Watchlist illimitée',
      'Toutes les timeframes (1s → 1W)',
      'Données temps réel',
      'Tous types de bougies',
      'Order Blocks + FVG auto',
      '10 alertes actives',
      'Replay historique',
      'Export PNG/SVG',
      'Templates sauvegardés',
    ],
    cta: 'Commencer Pro',
    ctaAction: 'pro_monthly',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 79,
    priceAnnual: 63,
    color: '#c6a34e',
    features: [
      'Tout Pro inclus',
      'Charts illimités',
      'Alertes illimitées',
      'Analyse IA Claude (SMC)',
      'Screener multi-actifs',
      'Journal de trading',
      'Room live (Freeman Academy)',
      'API accès (coming soon)',
      'Support prioritaire',
    ],
    cta: 'Commencer Premium',
    ctaAction: 'premium_monthly',
  },
]

export default function PricingModal({ onClose }) {
  const { user, profile, setAuthModal } = useAuth()
  const currentPlan = profile?.plan || 'free'

  const handleCTA = (plan) => {
    if (!user) { setAuthModal('register'); return }
    if (plan.ctaAction && STRIPE_LINKS[plan.ctaAction]) {
      const url = `${STRIPE_LINKS[plan.ctaAction]}?prefilled_email=${encodeURIComponent(user.email)}`
      window.open(url, '_blank')
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#1a1e2d', border: '1px solid #2a2e39', borderRadius: 12, maxWidth: 860, width: '100%', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #2a2e39', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Choisissez votre plan</div>
            <div style={{ fontSize: 12, color: '#787b86' }}>Break-even à 9 abonnés Pro · Annulation à tout moment</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#787b86', cursor: 'pointer', fontSize: 22 }}>×</button>
        </div>

        {/* Plans grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, padding: 0 }}>
          {plans.map((plan, idx) => (
            <div key={plan.id} style={{
              padding: '20px 20px 24px',
              borderRight: idx < 2 ? '1px solid #2a2e39' : 'none',
              background: plan.popular ? '#1e2a3a' : 'transparent',
              position: 'relative',
            }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: 12, right: 12, background: '#2962ff', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10, letterSpacing: '.04em' }}>
                  POPULAIRE
                </div>
              )}
              {currentPlan === plan.id && (
                <div style={{ position: 'absolute', top: 12, left: 12, background: '#26a69a20', color: '#26a69a', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
                  ACTUEL
                </div>
              )}

              <div style={{ fontSize: 13, fontWeight: 600, color: plan.color, marginBottom: 8, marginTop: currentPlan === plan.id || plan.popular ? 18 : 0 }}>
                {plan.name}
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
                  {plan.price === 0 ? '0' : plan.price}€
                </span>
                {plan.price > 0 && (
                  <span style={{ fontSize: 12, color: '#787b86' }}>/mois</span>
                )}
              </div>

              <button
                onClick={() => handleCTA(plan)}
                disabled={currentPlan === plan.id}
                style={{
                  width: '100%', background: currentPlan === plan.id ? '#2a2e39' : plan.color,
                  border: 'none', borderRadius: 5, color: currentPlan === plan.id ? '#787b86' : (plan.id === 'free' ? '#fff' : '#fff'),
                  fontSize: 12, fontWeight: 600, padding: '9px',
                  cursor: currentPlan === plan.id ? 'default' : 'pointer',
                  marginBottom: 18, fontFamily: 'JetBrains Mono, monospace',
                }}>
                {currentPlan === plan.id ? 'Plan actuel' : plan.cta}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11 }}>
                    <span style={{ color: '#26a69a', flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ color: '#b2b5be' }}>{f}</span>
                  </div>
                ))}
                {plan.limits?.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11 }}>
                    <span style={{ color: '#ef535060', flexShrink: 0, marginTop: 1 }}>✗</span>
                    <span style={{ color: '#5d606b' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #2a2e39', fontSize: 10, color: '#5d606b', textAlign: 'center' }}>
          Paiement sécurisé via Stripe · Aucune carte requise pour le plan Free · Annulation à tout moment · Aureus IA SPRL · BCE 1028.230.781
        </div>
      </div>
    </div>
  )
}
