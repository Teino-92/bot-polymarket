# 🆓 Polymarket API - Tout ce qu'on peut utiliser GRATUITEMENT

## 📊 Résumé

**Limite gratuite** : 1,000 appels/heure pour requêtes non-trading
**Coût** : 0€
**Authentification requise** : Non (sauf pour trading réel)

---

## 🎯 4 APIs Gratuites Principales

### 1. **Gamma API** - Découverte de marchés
**Base URL** : `https://gamma-api.polymarket.com`

#### Endpoints Disponibles

**GET /events** - Liste tous les événements
```
Paramètres:
- limit: Nombre de résultats (défaut: 100)
- offset: Pagination
- archived: true/false
- active: true/false
- closed: true/false
- slugs: Filtrer par slug
- tag_id: Filtrer par catégorie
- liquidity_min/max: Filtre liquidité
- volume_24h_min/max: Filtre volume 24h
- start_date_min/max: Filtre dates
- end_date_min/max: Filtre dates

Données retournées:
- ID événement
- Titre, description
- Marchés associés
- Volume total
- Liquidité
- Catégorie/tags
- Dates (création, fin, résolution)
```

**GET /events/{id}** - Détails d'un événement
```
Données retournées:
- Informations complètes événement
- Liste des marchés liés
- Statistiques détaillées
```

**GET /markets** - Liste tous les marchés
```
Paramètres:
- limit: Nombre de résultats
- offset: Pagination
- closed: true/false
- active: true/false
- archived: true/false
- market_ids: CSV de market IDs
- condition_ids: CSV de condition IDs
- token_ids: CSV de token IDs
- tag_id: Filtrer par tag
- liquidity_min/max: Filtre liquidité
- volume_24h_min/max: Filtre volume 24h

Données retournées:
- ID marché (condition_id, market_slug)
- Question
- Prix actuels (YES/NO)
- Spread
- Liquidité
- Volume 24h, 7j, total
- Outcomes (YES/NO)
- Dates importantes
- Nombre de traders
- Tags/catégories
```

**GET /markets?next_cursor=** - Pagination avancée
```
Pour récupérer TOUS les marchés (pas de limite):
- Utiliser next_cursor pour naviguer
- Charger par batch de 100-500
```

---

### 2. **CLOB API** - Prix et Orderbooks
**Base URL** : `https://clob.polymarket.com`

#### Endpoints Disponibles

**GET /price?token_id={token_id}&side={BUY|SELL}** - Prix actuel
```
Paramètres:
- token_id: ID du token (YES ou NO)
- side: BUY ou SELL

Données retournées:
- price: Prix actuel (0.00 - 1.00)
- side: Côté demandé
```

**GET /midpoint?token_id={token_id}** - Prix médian
```
Paramètres:
- token_id: ID du token

Données retournées:
- mid: Prix médian entre bid/ask
```

**GET /book?token_id={token_id}** - Orderbook complet
```
Paramètres:
- token_id: ID du token

Données retournées:
- bids: [price, size][]
- asks: [price, size][]
- timestamp
- market: Market ID
```

**GET /spread?token_id={token_id}** - Spread actuel
```
Données retournées:
- spread: Différence bid-ask
- bid: Meilleur prix achat
- ask: Meilleur prix vente
```

**GET /tick-size?token_id={token_id}** - Tick size
```
Données retournées:
- tick_size: Incrément minimum de prix
```

**GET /last-trade-price?token_id={token_id}** - Dernier prix tradé
```
Données retournées:
- price: Prix du dernier trade
- timestamp
```

---

### 3. **Data API** - Positions & Historique
**Base URL** : `https://data-api.polymarket.com`

#### Endpoints Disponibles

**GET /trades** - Historique de trades
```
Paramètres:
- user: Adresse wallet (optionnel)
- market: Condition ID (CSV supporté)
- limit: Max résultats (défaut: 100, max: 500)
- offset: Pagination
- takerOnly: true/false (défaut: true)
- filterType: CASH ou TOKENS
- filterAmount: Montant minimum
- side: BUY ou SELL
- start/end: Timestamps

Données retournées:
- trade_id
- side: BUY/SELL
- asset: Token ID
- size: Taille
- price: Prix
- timestamp
- transaction_hash
- trader: Pseudonyme
- outcome: YES/NO
```

**GET /activity** - Activité onchain
```
Paramètres:
- user: Adresse wallet (requis)
- limit: Max résultats (défaut: 100, max: 500)
- offset: Pagination
- market: Condition ID (CSV)
- type: TRADE, SPLIT, MERGE, REDEEM, REWARD, CONVERSION
- start/end: Timestamps
- side: BUY/SELL
- sortBy: TIMESTAMP, TOKENS, CASH

Données retournées:
- type: Type d'activité
- size: Taille tokens
- cash_amount: Montant USDC
- transaction_hash
- outcome: YES/NO
- timestamp
```

**GET /holders?market={condition_id}** - Top holders d'un marché
```
Paramètres:
- market: Condition ID (requis)
- limit: Nombre de holders (défaut: 100)

Données retournées:
- wallet: Adresse
- pseudonym: Pseudonyme
- amount: Nombre de tokens
- outcome_index: 0 (YES) ou 1 (NO)
```

**GET /value?user={address}** - Valeur portfolio
```
Paramètres:
- user: Adresse wallet (requis)
- market: Condition ID (optionnel, CSV)

Données retournées:
- user: Adresse
- value: Valeur totale USD
```

**GET /positions?user={address}** - Positions actuelles
```
Paramètres:
- user: Adresse wallet (requis)
- market: Condition ID (CSV)
- sizeThreshold: Taille minimum (défaut: 1.0)
- redeemable: true/false
- mergeable: true/false
- limit: Max résultats (défaut: 100, max: 500)
- offset: Pagination
- sortBy: TOKENS, CURRENT, INITIAL, CASHPNL, PERCENTPNL, TITLE, RESOLVING, PRICE

Données retournées:
- position_id
- market: Condition ID
- asset: Token ID
- size: Taille position
- average_price: Prix moyen d'entrée
- current_value: Valeur actuelle
- initial_value: Valeur initiale
- cash_pnl: P&L en USD
- percent_pnl: P&L en %
- market_title: Titre du marché
- outcome: YES/NO
```

---

### 4. **WebSocket API** - Temps réel
**Base URL** : `wss://ws-subscriptions-clob.polymarket.com/ws/`

#### Channels Disponibles

**market** - Updates orderbook en temps réel (PUBLIC)
```
Subscribe:
{
  "auth": {},
  "markets": ["token_id_1", "token_id_2"],
  "assets_ids": ["0x123..."]
}

Messages reçus:
- book: Orderbook complet
- price_change: Changement de prix
- last_trade_price: Dernier trade
- spread_change: Changement spread
```

**user** - Updates positions utilisateur (AUTH REQUISE)
```
Nécessite authentification
```

**RTDS** - Flux crypto prices
**Base URL** : `wss://ws-live-data.polymarket.com`
```
Messages:
- Crypto prices (BTC, ETH, etc.)
- Comment streams
```

---

## 🚀 Améliorations Possibles pour le Bot (0€)

### 1. **Scanner de Marchés Amélioré**
**Ce qu'on peut ajouter MAINTENANT** :

```typescript
// Au lieu de 6 marchés mockés, récupérer TOUS les marchés réels
async function getAllActiveMarkets() {
  let allMarkets = [];
  let nextCursor = null;

  do {
    const url = nextCursor
      ? `https://gamma-api.polymarket.com/markets?next_cursor=${nextCursor}&limit=500&active=true&closed=false`
      : `https://gamma-api.polymarket.com/markets?limit=500&active=true&closed=false`;

    const response = await fetch(url);
    const data = await response.json();

    allMarkets = allMarkets.concat(data);
    nextCursor = data.next_cursor; // Si présent
  } while (nextCursor);

  return allMarkets;
}
```

**Avantages** :
- ✅ Scanner 100% des marchés réels Polymarket
- ✅ Filtres avancés (volume, liquidité, catégories)
- ✅ Données fraîches en temps réel

---

### 2. **Calcul de Spread Réel**
**Ce qu'on peut ajouter** :

```typescript
async function getRealSpread(tokenId: string) {
  const response = await fetch(`https://clob.polymarket.com/spread?token_id=${tokenId}`);
  const data = await response.json();

  return {
    spread: data.spread,
    bid: data.bid,
    ask: data.ask,
    midpoint: (data.bid + data.ask) / 2
  };
}
```

**Avantages** :
- ✅ Spread réel (pas estimé)
- ✅ Meilleurs prix bid/ask
- ✅ Prix médian précis

---

### 3. **Analyse de Liquidité Profonde**
**Ce qu'on peut ajouter** :

```typescript
async function getOrderbookDepth(tokenId: string) {
  const response = await fetch(`https://clob.polymarket.com/book?token_id=${tokenId}`);
  const book = await response.json();

  // Calculer profondeur à différents niveaux
  const depth1pct = calculateDepth(book.bids, book.asks, 0.01);
  const depth2pct = calculateDepth(book.bids, book.asks, 0.02);
  const depth5pct = calculateDepth(book.bids, book.asks, 0.05);

  return {
    totalBidLiquidity: sumOrders(book.bids),
    totalAskLiquidity: sumOrders(book.asks),
    depth1pct,
    depth2pct,
    depth5pct,
    imbalance: (sumOrders(book.bids) - sumOrders(book.asks)) / (sumOrders(book.bids) + sumOrders(book.asks))
  };
}
```

**Avantages** :
- ✅ Profondeur réelle du carnet d'ordres
- ✅ Déséquilibre bid/ask (indicateur de momentum)
- ✅ Estimer slippage pour grandes positions

---

### 4. **Analyse des Holders**
**Ce qu'on peut ajouter** :

```typescript
async function analyzeMarketHolders(conditionId: string) {
  const response = await fetch(`https://data-api.polymarket.com/holders?market=${conditionId}&limit=100`);
  const holders = await response.json();

  // Distribution YES vs NO
  const yesHolders = holders.filter(h => h.outcome_index === 0);
  const noHolders = holders.filter(h => h.outcome_index === 1);

  // Concentration (Gini coefficient)
  const totalYES = yesHolders.reduce((sum, h) => sum + h.amount, 0);
  const totalNO = noHolders.reduce((sum, h) => sum + h.amount, 0);

  return {
    topHoldersYES: yesHolders.slice(0, 10),
    topHoldersNO: noHolders.slice(0, 10),
    yesConcentration: yesHolders[0]?.amount / totalYES, // % détenu par top holder
    noConcentration: noHolders[0]?.amount / totalNO,
    totalHolders: holders.length,
    yesNoRatio: totalYES / totalNO
  };
}
```

**Avantages** :
- ✅ Identifier marchés manipulés (forte concentration)
- ✅ Sentiment des gros holders
- ✅ Risque de "whale dump"

---

### 5. **Historique de Trades**
**Ce qu'on peut ajouter** :

```typescript
async function getTradeHistory(conditionId: string, hours: number = 24) {
  const start = Date.now() - hours * 60 * 60 * 1000;

  const response = await fetch(
    `https://data-api.polymarket.com/trades?market=${conditionId}&start=${start}&limit=500`
  );
  const trades = await response.json();

  // Calculer métriques
  const buyVolume = trades.filter(t => t.side === 'BUY').reduce((sum, t) => sum + t.size, 0);
  const sellVolume = trades.filter(t => t.side === 'SELL').reduce((sum, t) => sum + t.size, 0);

  const avgBuyPrice = trades.filter(t => t.side === 'BUY').reduce((sum, t) => sum + t.price, 0) / buyVolume;
  const avgSellPrice = trades.filter(t => t.side === 'SELL').reduce((sum, t) => sum + t.price, 0) / sellVolume;

  return {
    totalTrades: trades.length,
    buyVolume,
    sellVolume,
    volumeImbalance: (buyVolume - sellVolume) / (buyVolume + sellVolume),
    avgBuyPrice,
    avgSellPrice,
    momentum: avgBuyPrice > avgSellPrice ? 'BULLISH' : 'BEARISH'
  };
}
```

**Avantages** :
- ✅ Momentum réel (buy pressure vs sell pressure)
- ✅ Volume imbalance
- ✅ Identifier accumulation/distribution

---

### 6. **WebSocket pour Prix Temps Réel**
**Ce qu'on peut ajouter** :

```typescript
function subscribeToMarketUpdates(tokenIds: string[]) {
  const ws = new WebSocket('wss://ws-subscriptions-clob.polymarket.com/ws/');

  ws.on('open', () => {
    ws.send(JSON.stringify({
      auth: {},
      markets: tokenIds,
      assets_ids: []
    }));
  });

  ws.on('message', (data) => {
    const update = JSON.parse(data);

    if (update.type === 'price_change') {
      console.log(`Prix changé: ${update.token_id} → ${update.price}`);
      // Mettre à jour nos positions en temps réel
    }

    if (update.type === 'spread_change') {
      console.log(`Spread changé: ${update.spread}`);
      // Détecter opportunités FLIP
    }
  });

  return ws;
}
```

**Avantages** :
- ✅ Updates en temps réel (pas besoin d'attendre 4h)
- ✅ Réagir instantanément aux opportunités
- ✅ Monitor stop-loss en continu

---

### 7. **Scoring Avancé des Marchés**
**Ce qu'on peut calculer GRATUITEMENT** :

```typescript
interface EnhancedMarketScore {
  // Données existantes
  hvs: number;
  flipEV: number;

  // Nouvelles métriques GRATUITES
  spreadQuality: number;        // Spread réel vs spread théorique
  liquidityDepth: number;       // Profondeur orderbook
  volumeTrend: number;          // Trend volume 24h
  momentum: number;             // Buy pressure - Sell pressure
  holderConcentration: number;  // Risque manipulation
  tradesPerHour: number;        // Activité
  priceStability: number;       // Volatilité
  competitionLevel: number;     // Nombre de market makers
}
```

---

## 📈 Plan d'Implémentation (Par priorité)

### Phase 1 - Quick Wins (1-2h)
1. ✅ **Remplacer marchés mockés par Gamma API**
   - Scanner TOUS les marchés réels
   - Filtrer par volume/liquidité

2. ✅ **Ajouter spread réel (CLOB API)**
   - Calcul précis du spread
   - Meilleurs prix bid/ask

### Phase 2 - Améliorations (2-4h)
3. ✅ **Orderbook depth analysis**
   - Profondeur liquidité
   - Imbalance bid/ask

4. ✅ **Trade history analysis**
   - Volume imbalance
   - Momentum détection

### Phase 3 - Avancé (4-8h)
5. ✅ **Holder analysis**
   - Top holders
   - Concentration risk

6. ✅ **WebSocket temps réel**
   - Prix live
   - Spread monitoring

### Phase 4 - ML/Analytics (optionnel)
7. ⏳ **Prédiction de win probability**
   - Historical resolution data
   - Pattern matching

8. ⏳ **Auto-ajustement des seuils**
   - ML sur historique trades
   - Optimisation HVS/FlipEV thresholds

---

## 💰 Ce qui COÛTE de l'argent (à éviter)

### ❌ Premium Tier ($99+/mois)
- WebSocket prioritaire
- Historique >30 jours
- Support premium
- Rate limits plus élevés

### ❌ Trading Réel
- Gas fees Polygon (~$0.01/trade)
- Capital (150€ minimum)
- Slippage sur gros ordres

---

## ✅ Checklist d'Implémentation

### Immédiat (aujourd'hui)
- [ ] Remplacer `getMockMarkets()` par appel Gamma API
- [ ] Utiliser CLOB API pour spread réel
- [ ] Ajouter champ `realSpread` dans `MarketData`

### Court terme (cette semaine)
- [ ] Implémenter `getOrderbookDepth()`
- [ ] Implémenter `getTradeHistory()`
- [ ] Ajouter scoring avancé avec nouvelles métriques

### Moyen terme (ce mois)
- [ ] Implémenter `analyzeMarketHolders()`
- [ ] Setup WebSocket pour monitoring temps réel
- [ ] Dashboard: ajouter graphiques volume/momentum

---

## 📚 Sources

- [Polymarket Documentation](https://docs.polymarket.com/)
- [Polymarket API Endpoints](https://docs.polymarket.com/quickstart/reference/endpoints)
- [Polymarket Data API Gist](https://gist.github.com/shaunlebron/0dd3338f7dea06b8e9f8724981bb13bf)
- [Polymarket py-clob-client](https://github.com/Polymarket/py-clob-client)
- [Apidog Polymarket Guide](https://apidog.com/blog/polymarket-api/)

---

**Résumé** : On a accès à TOUTES les données nécessaires GRATUITEMENT. Le seul coût réel c'est le trading (gas fees + capital). Tout le reste (analyse, monitoring, ML) est 100% gratuit avec 1,000 calls/h !
