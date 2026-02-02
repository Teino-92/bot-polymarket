# 🧹 Nettoyage Base de Données - Résolution Conflits

## 🚨 Problèmes identifiés

### 1. **Double table `bot_config`** (CONFLIT)

**Migration 004_bot_config.sql** (❌ Non utilisée)
- Format key-value : `(key TEXT, value JSONB)`
- Insertion : `max_position_size_eur` = `'75'` (string)
- **Jamais utilisée par le code**

**Migration 005_bot_config_table.sql** (✅ Utilisée)
- Format colonnes : `max_position_size_eur NUMERIC`
- Insertion : `max_position_size_eur` = `75` (number)
- **Utilisée par `/api/bot/config`**

### Conséquence
- Valeur codée en dur à 75€ dans 2 endroits
- Même après mise à jour du code, la DB garde 75€

---

## ✅ Solution : Migration 006

**Fichier** : `supabase/migrations/006_fix_bot_config_conflict.sql`

### Actions :
1. ✅ Supprime l'ancienne table `bot_config` (004)
2. ✅ Recrée la bonne table avec structure colonnes
3. ✅ Force `max_position_size_eur = 5` (au lieu de 75)
4. ✅ Ajoute un trigger pour `updated_at`

---

## 📋 Ordre d'exécution des migrations

```
000_functions.sql          → Fonctions utilitaires
001_trades.sql             → Table trades
002_positions.sql          → Table positions
003_market_scan.sql        → Table market_scan
004_bot_config.sql         → ❌ ANCIENNE (à ignorer)
005_bot_config_table.sql   → ✅ BONNE structure
005_add_close_fields.sql   → Ajout champs fermeture positions
006_fix_bot_config_conflict.sql → 🆕 FIX des conflits
```

---

## 🔧 Application de la migration

### Sur Supabase Production :

**Option A : Dashboard**
1. https://supabase.com/dashboard → Ton projet
2. SQL Editor → New Query
3. Copier le contenu de `006_fix_bot_config_conflict.sql`
4. Run

**Option B : CLI**
```bash
supabase db push
```

---

## ✅ Vérification

Après application, vérifier :

```sql
-- Doit retourner UNE SEULE table bot_config
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bot_config'
ORDER BY ordinal_position;

-- Doit afficher max_position_size_eur = 5
SELECT * FROM bot_config WHERE id = 'default';
```

Résultat attendu :
```
id      | default
max_position_size_eur | 5
```

---

## 📊 Sources de configuration (après fix)

1. **Code** (`lib/config.ts`) : `maxPositionSizeEur = 5` ✅
2. **API** (`app/api/bot/config/route.ts`) : default = `5` ✅
3. **Base de données** : `max_position_size_eur = 5` ✅

**Plus de conflit !**
