# LoL Tracker 🏆

Analyse ton historique League of Legends : top 5 champions les plus joués par saison (2023–2026), rank actuel, stats détaillées.

**Stack** : Next.js 14 · TypeScript · Tailwind CSS · Prisma · PostgreSQL · API Riot

---

## Aperçu des fonctionnalités

- 🔍 **Recherche par Riot ID** (format `gameName#tagLine`)
- 🌍 **Multi-région** : EUW, EUNE, NA, KR, BR, JP
- 🏅 **Rank actuel** : Solo Queue avec winrate
- 🎮 **Top 5 champions** sur les saisons 2023 à 2026
- 📊 **Détail par saison** : nombre de parties par année civile
- 💾 **Cache intelligent** : matchs stockés en DB pour éviter les re-fetches
- ⚠️ **Données partielles** : signalement clair si l'historique est incomplet

---

## Prérequis

- Node.js 18+
- PostgreSQL 14+ (local ou Neon.tech / Vercel Postgres)
- Clé API Riot Games : [developer.riotgames.com](https://developer.riotgames.com)

---

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-user/lol-tracker.git
cd lol-tracker
npm install
```

### 2. Variables d'environnement

```bash
cp .env.example .env.local
```

Éditez `.env.local` :

```env
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
DATABASE_URL=postgresql://postgres:password@localhost:5432/loltracker
```

> ⚠️ La clé API Riot en développement expire après 24h. Renouvelez-la sur le portail Riot.

### 3. Base de données

```bash
# Créer la base (si locale)
createdb loltracker

# Appliquer le schéma Prisma
npm run db:migrate

# (Optionnel) Insérer des données de test
npx ts-node prisma/seed.ts
```

### 4. Lancer en développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                      # Homepage avec recherche
│   ├── player/[riotId]/page.tsx      # Page résultat joueur
│   └── api/player/
│       ├── search/route.ts           # POST - valide et cherche le joueur
│       └── [riotId]/summary/route.ts # GET - agrège toutes les données
├── lib/
│   ├── db.ts                         # Singleton Prisma
│   ├── utils.ts                      # Utilitaires métier
│   └── riot/
│       ├── riotAccountService.ts     # Account-V1 + Summoner-V4
│       ├── riotRankService.ts        # League-V4
│       ├── riotMatchService.ts       # Match-V5 + sync DB
│       └── championAggregationService.ts # Cache stats champions
├── components/
│   ├── player/PlayerHeader.tsx       # Header joueur
│   ├── champion/ChampionCards.tsx    # Cards top 5 champions
│   ├── champion/SummaryTable.tsx     # Tableau récapitulatif
│   └── ui/
│       ├── LoadingState.tsx          # État de chargement
│       └── ErrorState.tsx            # Gestion d'erreurs
└── types/index.ts                    # Types TypeScript
```

---

## Endpoints API

### `POST /api/player/search`

Valide le Riot ID et retourne le PUUID.

```json
// Body
{ "riotId": "seyzo#euw", "region": "EUW1" }

// Réponse succès
{ "success": true, "data": { "puuid": "...", "gameName": "seyzo", "tagLine": "euw" } }

// Réponse erreur
{ "success": false, "error": "Joueur introuvable", "code": "PLAYER_NOT_FOUND" }
```

### `GET /api/player/{riotId}/summary?region=EUW1`

Retourne le résumé complet : rank + top 5 champions par saison.

```json
{
  "success": true,
  "data": {
    "gameName": "seyzo",
    "tagLine": "euw",
    "profileIconId": 4568,
    "summonerLevel": 312,
    "rank": {
      "tier": "GOLD",
      "rank": "II",
      "leaguePoints": 45,
      "wins": 120,
      "losses": 98,
      "winRate": 55
    },
    "topChampions": [
      {
        "championName": "Jinx",
        "games": { "2026": 80, "2025": 130, "2024": 87, "2023": 42 },
        "total": 339,
        "isPartial": false
      }
    ]
  }
}
```

---

## Stratégie de cache

| Niveau | Quoi | Durée |
|--------|------|-------|
| DB `Match` | Chaque match individuel | Permanent (jamais supprimé) |
| DB `ChampionSeasonStats` | Stats agrégées | 1 heure |
| DB `Player.updatedAt` | Timestamp sync | 30 minutes avant re-sync |
| Next.js `revalidate` | Cache route handler | 10 minutes |

La première analyse peut prendre **20–60 secondes** si l'historique est vide (jusqu'à 400 matchs à fetch). Les analyses suivantes sont quasi-instantanées grâce au cache DB.

---

## Rate Limits Riot

L'API Riot limite les appels :

- **Development key** : 20 req/s, 100 req/2min
- **Production key** : beaucoup plus élevé après validation

Le projet ajoute automatiquement un délai de **1200ms entre les requêtes Match-V5** pour rester dans les limites. En cas de 429, l'erreur est remontée proprement à l'utilisateur.

---

## Déploiement sur Vercel

1. Pusher le code sur GitHub
2. Importer le projet sur [vercel.com](https://vercel.com)
3. Ajouter les variables d'environnement :
   - `RIOT_API_KEY`
   - `DATABASE_URL` (Vercel Postgres ou Neon)
4. Déployer

```bash
# Build de production
npm run build
```

> 💡 Utilisez [Neon.tech](https://neon.tech) pour une PostgreSQL serverless gratuite compatible Vercel.

---

## Ajouter une nouvelle région

Dans `src/lib/utils.ts`, ajoutez la région à :
1. Le type `Region`
2. La fonction `getRegionalRoute()`
3. La liste `REGIONS` dans `src/app/page.tsx`

---

## Saisons

| Saison | Période |
|--------|---------|
| 2026 | 1er jan 2026 → 31 déc 2026 |
| 2025 | 1er jan 2025 → 31 déc 2025 |
| 2024 | 1er jan 2024 → 31 déc 2024 |
| 2023 | 1er jan 2023 → 31 déc 2023 |

Seules les parties **Ranked Solo Queue (queueId: 420)** sont comptabilisées.

---

## Licence

Projet personnel. Données Riot Games via l'API officielle. Non affilié à Riot Games.

> *"LoL Tracker isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties."*
