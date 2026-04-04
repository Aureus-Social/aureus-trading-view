# Aureus Trading View

Plateforme de charting institutionnel temps réel — Alternative TradingView construite avec Lightweight Charts v5.

## Stack technique
- **Chart** : [TradingView Lightweight Charts v5](https://tradingview.github.io/lightweight-charts)
- **Frontend** : React 18 + Vite + Zustand
- **Données live** : [Polygon.io](https://polygon.io) WebSocket (XAUUSD, Forex) + Binance (Crypto)
- **Indicateurs** : EMA, SMA, WMA, RSI, MACD, Bollinger Bands, ATR, Stochastic, VWAP
- **SMC** : Order Blocks auto, Fair Value Gaps, BOS/CHOCH
- **Types de bougies** : Japonaises, Heikin Ashi, OHLC Barres, Ligne, Aire, Hollow

## Installation

```bash
npm install
cp .env.example .env
# Ajouter ta clé Polygon.io dans .env
npm run dev
```

## Variables d'environnement

```
VITE_POLYGON_API_KEY=ta_clé_polygon_io
```

## Déploiement Vercel

```bash
vercel --prod
```

## Fonctionnalités
- ✅ Chart live avec WebSocket
- ✅ 6 types de bougies (japonaises, HA, barres, ligne, aire, hollow)
- ✅ Multi-EMA/SMA/WMA (période et couleur libres)
- ✅ RSI, MACD, Volume — panneaux séparés synchronisés
- ✅ Bollinger Bands, VWAP
- ✅ Order Blocks SMC automatiques
- ✅ Fair Value Gaps automatiques
- ✅ Couleurs 100% configurables
- ✅ Watchlist 15 symboles live
- ✅ Recherche symbole
- ✅ 9 timeframes (1s → 1W)

## Roadmap Phase 2
- [ ] Auth Supabase + abonnements Stripe
- [ ] Alertes prix (push + email + Telegram)
- [ ] Screener multi-actifs
- [ ] Replay historique
- [ ] Journal de trading
- [ ] Analyse IA Claude (SMC bias)
- [ ] Room live Freeman Academy

---
**Aureus IA SPRL** · BCE 1028.230.781 · Saint-Gilles, Bruxelles
