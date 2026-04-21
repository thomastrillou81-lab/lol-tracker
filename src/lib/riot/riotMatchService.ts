// riotMatchService - Récupère et stocke les matchs ranked d'un joueur par saison

import type { RiotMatch, Region, SeasonDateRange } from '@/types';
import { getRegionalRoute, getRegionalBaseUrl, getSeasonFromTimestamp } from '@/lib/utils';
import { RiotRateLimitError, RiotNotFoundError, RiotApiError } from './riotAccountService';
import { prisma } from '@/lib/db';

const RIOT_API_KEY = process.env.RIOT_API_KEY!;

// Queue IDs Riot : 420 = Ranked Solo, 440 = Ranked Flex
const RANKED_QUEUE_IDS = [420, 440];

// Nombre de matchs par requête (max Riot = 100)
const MATCHES_PER_REQUEST = 100;

// Délai entre requêtes pour respecter le rate limit (ms)
const REQUEST_DELAY_MS = 1200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch la liste des match IDs pour un PUUID et une plage de dates
 */
async function fetchMatchIds(
  puuid: string,
  route: string,
  startTime: number,
  endTime: number,
  start: number = 0
): Promise<string[]> {
  const url = new URL(
    `${getRegionalBaseUrl(route as any)}/lol/match/v5/matches/by-puuid/${puuid}/ids`
  );
  url.searchParams.set('queue', '420'); // Ranked Solo uniquement
  url.searchParams.set('startTime', String(startTime));
  url.searchParams.set('endTime', String(endTime));
  url.searchParams.set('count', String(MATCHES_PER_REQUEST));
  url.searchParams.set('start', String(start));

  const res = await fetch(url.toString(), {
    headers: { 'X-Riot-Token': RIOT_API_KEY },
  });

  if (res.status === 429) throw new RiotRateLimitError('Rate limit Riot');
  if (res.status === 404) return [];
  if (!res.ok) throw new RiotApiError(`Erreur Match-V5: ${res.status}`);

  return res.json();
}

/**
 * Fetch les détails d'un match individuel
 */
async function fetchMatchDetail(matchId: string, routeBase: string): Promise<RiotMatch> {
  const url = `${routeBase}/lol/match/v5/matches/${matchId}`;
  const res = await fetch(url, {
    headers: { 'X-Riot-Token': RIOT_API_KEY },
  });

  if (res.status === 429) throw new RiotRateLimitError('Rate limit Riot');
  if (res.status === 404) throw new RiotNotFoundError(`Match ${matchId} introuvable`);
  if (!res.ok) throw new RiotApiError(`Erreur Match-V5 detail: ${res.status}`);

  return res.json();
}

/**
 * Synchronise tous les matchs d'un joueur pour une saison donnée
 * Stocke en base pour éviter de re-fetcher.
 * Retourne le nombre de nouveaux matchs ajoutés.
 */
export async function syncMatchesForSeason(
  puuid: string,
  season: SeasonDateRange,
  region: Region = 'EUW1'
): Promise<{ synced: number; isPartial: boolean }> {
  const route = getRegionalRoute(region);
  const routeBase = getRegionalBaseUrl(route);

  // Vérifier quels match IDs sont déjà en base pour cette saison
  const existingMatches = await prisma.match.findMany({
    where: { puuid, season: season.season },
    select: { matchId: true },
  });
  const existingIds = new Set(existingMatches.map((m) => m.matchId));

  let allMatchIds: string[] = [];
  let start = 0;
  let hasMore = true;

  // Paginer pour récupérer tous les match IDs
  while (hasMore) {
    const ids = await fetchMatchIds(puuid, route, season.startTimestamp, season.endTimestamp, start);
    allMatchIds.push(...ids);

    if (ids.length < MATCHES_PER_REQUEST) {
      hasMore = false;
    } else {
      start += MATCHES_PER_REQUEST;
      await sleep(REQUEST_DELAY_MS); // Rate limit safety
    }
  }

  // Filtrer les matchs déjà en base
  const newMatchIds = allMatchIds.filter((id) => !existingIds.has(id));

  let synced = 0;
  let errors = 0;

  // Fetch et stocker les nouveaux matchs
  for (const matchId of newMatchIds) {
    try {
      await sleep(REQUEST_DELAY_MS / 2); // Throttle
      const matchDetail = await fetchMatchDetail(matchId, routeBase);

      // Trouver les données du participant correspondant au PUUID
      const participant = matchDetail.info.participants.find((p) => p.puuid === puuid);
      if (!participant) continue;

      const gameCreation = new Date(matchDetail.info.gameCreation);
      const matchSeason = getSeasonFromTimestamp(matchDetail.info.gameCreation);

      // Upsert pour éviter les doublons
      await prisma.match.upsert({
        where: { matchId_puuid: { matchId, puuid } },
        update: {},
        create: {
          matchId,
          puuid,
          gameCreation,
          championName: participant.championName,
          queueId: matchDetail.info.queueId,
          season: matchSeason,
        },
      });

      synced++;
    } catch (err) {
      // Log l'erreur mais continue pour ne pas bloquer toute la sync
      console.error(`Erreur sur match ${matchId}:`, err);
      errors++;
    }
  }

  // isPartial si on a eu trop d'erreurs (> 10% des matchs)
  const isPartial = errors > 0 && errors > allMatchIds.length * 0.1;

  return { synced, isPartial };
}

/**
 * Récupère tous les matchs d'un joueur depuis la base de données
 */
export async function getStoredMatches(puuid: string, seasons: number[]) {
  return prisma.match.findMany({
    where: { puuid, season: { in: seasons } },
    select: { championName: true, season: true, queueId: true },
  });
}
