// championAggregationService - Agrège les stats de champions par saison

import type { ChampionSeasonData } from '@/types';
import { prisma } from '@/lib/db';
import { aggregateChampionGamesBySeason, getTop5ChampionsAcrossSeasons } from '@/lib/utils';

const SEASONS = [2026, 2025, 2024, 2023];

/**
 * Calcule et met en cache les stats de champions pour un joueur
 * Recalcule depuis les matchs en base si les stats sont absentes ou outdated (> 1h)
 */
export async function getOrComputeChampionStats(
  puuid: string,
  isPartial: boolean = false
): Promise<ChampionSeasonData[]> {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  // Vérifier si on a des stats récentes en cache
  const cachedStats = await prisma.championSeasonStats.findMany({
    where: {
      puuid,
      season: { in: SEASONS },
      updatedAt: { gte: new Date(Date.now() - ONE_HOUR_MS) },
    },
    orderBy: [{ season: 'desc' }],
  });

  // Si on a des stats pour toutes les saisons et pour au moins 1 champion → utiliser le cache
  const hasFullCache = cachedStats.length > 0;
  if (hasFullCache) {
    return buildChampionDataFromCache(cachedStats);
  }

  // Sinon, calculer depuis les matchs
  return computeAndCacheChampionStats(puuid, isPartial);
}

/**
 * Construit les ChampionSeasonData depuis le cache DB
 */
function buildChampionDataFromCache(
  stats: Array<{ championName: string; season: number; games: number; isPartial: boolean }>
): ChampionSeasonData[] {
  // Regrouper par champion
  const byChampion: Record<string, Record<number, number>> = {};
  const partialMap: Record<string, boolean> = {};

  for (const stat of stats) {
    if (!byChampion[stat.championName]) {
      byChampion[stat.championName] = {};
      partialMap[stat.championName] = false;
    }
    byChampion[stat.championName][stat.season] = stat.games;
    if (stat.isPartial) partialMap[stat.championName] = true;
  }

  const result = getTop5ChampionsAcrossSeasons(byChampion, false);

  // Appliquer le flag partial
  return result.map((c) => ({ ...c, isPartial: partialMap[c.championName] ?? false }));
}

/**
 * Calcule les stats depuis les matchs en base et les met en cache
 */
async function computeAndCacheChampionStats(
  puuid: string,
  isPartial: boolean
): Promise<ChampionSeasonData[]> {
  // Récupérer tous les matchs Ranked Solo depuis la base
  const matches = await prisma.match.findMany({
    where: { puuid, season: { in: SEASONS }, queueId: 420 }, // 420 = Ranked Solo
    select: { championName: true, season: true },
  });

  if (matches.length === 0) return [];

  const aggregated = aggregateChampionGamesBySeason(matches);
  const top5 = getTop5ChampionsAcrossSeasons(aggregated, isPartial);

  // Mettre en cache via upsert
  await prisma.$transaction(
    top5.flatMap((champ) =>
      SEASONS.map((season) =>
        prisma.championSeasonStats.upsert({
          where: {
            puuid_championName_season: {
              puuid,
              championName: champ.championName,
              season,
            },
          },
          update: { games: champ.games[season] ?? 0, isPartial },
          create: {
            puuid,
            championName: champ.championName,
            season,
            games: champ.games[season] ?? 0,
            isPartial,
          },
        })
      )
    )
  );

  return top5;
}

/**
 * Invalide le cache des stats d'un joueur (forcer recalcul)
 */
export async function invalidateChampionStatsCache(puuid: string): Promise<void> {
  await prisma.championSeasonStats.deleteMany({ where: { puuid } });
}
