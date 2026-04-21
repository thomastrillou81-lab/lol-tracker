// Utilitaires métier - parsing, dates de saisons, agrégation

import type { ParsedRiotId, SeasonDateRange, ChampionSeasonData, Region, RegionalRoute } from '@/types';

// ─── Parsing du Riot ID ────────────────────────────────────────────────────────

/**
 * Parse un Riot ID au format "gameName#tagLine"
 * Valide le format et retourne les composants séparés
 */
export function parseRiotId(input: string): ParsedRiotId | null {
  const trimmed = input.trim();

  // Vérification du format basique
  const hashIndex = trimmed.lastIndexOf('#');
  if (hashIndex === -1 || hashIndex === 0 || hashIndex === trimmed.length - 1) {
    return null;
  }

  const gameName = trimmed.substring(0, hashIndex).trim();
  const tagLine = trimmed.substring(hashIndex + 1).trim();

  // Validations Riot :
  // gameName : 3-16 caractères
  // tagLine : 2-5 caractères alphanumériques
  if (gameName.length < 3 || gameName.length > 16) return null;
  if (tagLine.length < 2 || tagLine.length > 5) return null;
  if (!/^[a-zA-Z0-9 _\.]+$/.test(gameName)) return null;
  if (!/^[a-zA-Z0-9]+$/.test(tagLine)) return null;

  return { gameName, tagLine };
}

// ─── Plages de dates par saison ───────────────────────────────────────────────

const SEASONS = [2026, 2025, 2024, 2023] as const;

/**
 * Retourne les plages de timestamps Unix (en secondes) pour chaque saison civile
 * Une saison = du 1er janvier au 31 décembre de l'année
 */
export function getSeasonDateRanges(): SeasonDateRange[] {
  return SEASONS.map((year) => ({
    season: year,
    // Date.UTC garantit UTC, pas de problème de fuseau horaire
    startTimestamp: Math.floor(Date.UTC(year, 0, 1) / 1000),
    endTimestamp: Math.floor(Date.UTC(year, 11, 31, 23, 59, 59) / 1000),
  }));
}

/**
 * Retourne l'année civile d'un timestamp Unix (en millisecondes)
 */
export function getSeasonFromTimestamp(timestampMs: number): number {
  return new Date(timestampMs).getUTCFullYear();
}

// ─── Agrégation par champion ───────────────────────────────────────────────────

interface RawMatch {
  championName: string;
  season: number;
}

/**
 * Agrège les parties par champion et par saison
 * Retourne un Record<championName, Record<season, gamesCount>>
 */
export function aggregateChampionGamesBySeason(
  matches: RawMatch[]
): Record<string, Record<number, number>> {
  const result: Record<string, Record<number, number>> = {};

  for (const match of matches) {
    if (!result[match.championName]) {
      result[match.championName] = {};
    }
    result[match.championName][match.season] =
      (result[match.championName][match.season] || 0) + 1;
  }

  return result;
}

/**
 * Calcule le top 5 champions sur les 4 saisons combinées
 * Tri décroissant par total, puis par saison la plus récente en cas d'égalité
 */
export function getTop5ChampionsAcrossSeasons(
  aggregated: Record<string, Record<number, number>>,
  isPartial: boolean = false
): ChampionSeasonData[] {
  const seasons = SEASONS as readonly number[];

  const champions: ChampionSeasonData[] = Object.entries(aggregated).map(
    ([championName, seasonGames]) => {
      const games: Record<number, number> = {};
      let total = 0;

      for (const season of seasons) {
        games[season] = seasonGames[season] || 0;
        total += games[season];
      }

      return { championName, games, total, isPartial };
    }
  );

  // Tri : total décroissant, puis saison la plus récente en cas d'égalité
  champions.sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    // Départage par saison la plus récente (2026, puis 2025, etc.)
    for (const season of seasons) {
      if (b.games[season] !== a.games[season]) {
        return b.games[season] - a.games[season];
      }
    }
    return 0;
  });

  return champions.slice(0, 5);
}

// ─── Routing Riot API ──────────────────────────────────────────────────────────

/**
 * Map région → route régionale Riot
 */
export function getRegionalRoute(region: Region): RegionalRoute {
  const map: Record<Region, RegionalRoute> = {
    EUW1: 'EUROPE',
    EUN1: 'EUROPE',
    TR1: 'EUROPE',
    RU: 'EUROPE',
    NA1: 'AMERICAS',
    BR1: 'AMERICAS',
    LA1: 'AMERICAS',
    LA2: 'AMERICAS',
    KR: 'ASIA',
    JP1: 'ASIA',
    OC1: 'SEA',
  };
  return map[region] ?? 'EUROPE';
}

/**
 * Retourne l'URL de base pour les appels régionaux Riot
 */
export function getRegionalBaseUrl(route: RegionalRoute): string {
  return `https://${route.toLowerCase()}.api.riotgames.com`;
}

/**
 * Retourne l'URL de base pour les appels spécifiques à une plateforme
 */
export function getPlatformBaseUrl(region: Region): string {
  return `https://${region.toLowerCase()}.api.riotgames.com`;
}

// ─── Data Dragon ───────────────────────────────────────────────────────────────

const DD_VERSION = '14.24.1'; // À mettre à jour selon la version actuelle

export function getChampionImageUrl(championName: string): string {
  // Certains champions ont un nom Data Dragon différent de leur nom affiché
  const nameMap: Record<string, string> = {
    "Nunu & Willump": "Nunu",
    "Renata Glasc": "Renata",
    "Wukong": "MonkeyKing",
    "Jarvan IV": "JarvanIV",
    "LeBlanc": "Leblanc",
    "Kog'Maw": "KogMaw",
    "Cho'Gath": "Chogath",
    "Vel'Koz": "Velkoz",
    "Kai'Sa": "Kaisa",
    "Kha'Zix": "Khazix",
    "Rek'Sai": "RekSai",
    "Bel'Veth": "Belveth",
    "K'Sante": "KSante",
    "Aurelion Sol": "AurelionSol",
    "Dr. Mundo": "DrMundo",
    "Miss Fortune": "MissFortune",
    "Twisted Fate": "TwistedFate",
    "Master Yi": "MasterYi",
    "Lee Sin": "LeeSin",
    "Xin Zhao": "XinZhao",
  };

  const ddName = nameMap[championName] ?? championName.replace(/[^a-zA-Z0-9]/g, '');
  return `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/champion/${ddName}.png`;
}

export function getProfileIconUrl(iconId: number): string {
  return `https://ddragon.leagueoflegends.com/cdn/${DD_VERSION}/img/profileicon/${iconId}.png`;
}

// ─── Rank formatting ───────────────────────────────────────────────────────────

export const RANK_ORDER: Record<string, number> = {
  IRON: 0, BRONZE: 1, SILVER: 2, GOLD: 3,
  PLATINUM: 4, EMERALD: 5, DIAMOND: 6,
  MASTER: 7, GRANDMASTER: 8, CHALLENGER: 9,
};

export const RANK_COLORS: Record<string, string> = {
  IRON: '#6b7280',
  BRONZE: '#cd7f32',
  SILVER: '#9ca3af',
  GOLD: '#f59e0b',
  PLATINUM: '#10b981',
  EMERALD: '#059669',
  DIAMOND: '#818cf8',
  MASTER: '#c084fc',
  GRANDMASTER: '#f87171',
  CHALLENGER: '#fbbf24',
};

export function formatRank(tier: string, rank: string, lp: number): string {
  const isApex = ['MASTER', 'GRANDMASTER', 'CHALLENGER'].includes(tier);
  const tierFormatted = tier.charAt(0) + tier.slice(1).toLowerCase();
  return isApex ? `${tierFormatted} ${lp} LP` : `${tierFormatted} ${rank} ${lp} LP`;
}
