import type { ChampionSeasonData } from '@/types';
import { prisma } from '@/lib/db';
import { aggregateChampionGamesBySeason, getTop5ChampionsAcrossSeasons } from '@/lib/utils';

const SEASONS = [2026, 2025, 2024, 2023];

export async function getOrComputeChampionStats(
  puuid: string,
  isPartial: boolean = false
): Promise<ChampionSeasonData[]> {
  const ONE_HOUR_MS = 60 * 60 * 1000;

  const cachedStats = await prisma.championSeasonStats.findMany({
    where: {
      puuid,
      season: { in: SEASONS },
      updatedAt: { gte: new Date(Date.now() - ONE_HOUR_MS) },
    },
    orderBy: [{ season: 'desc' }],
  });

  const hasFullCache = cachedStats.length > 0;
  if (hasFullCache) {
    return buildChampionDataFromCache(cachedStats);
  }

  return computeAndCacheChampionStats(puuid, isPartial);
}

function buildChampionDataFromCache(
  stats: Array<{ championName: string; season: number; games: number; isPartial: boolean }>
): ChampionSeasonData[] {
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
  return result.map((c) => ({ ...c, isPartial: partialMap[c.championName] ?? false }));
}

async function computeAndCacheChampionStats(
  puuid: string,
  isPartial: boolean
): Promise<ChampionSeasonData[]> {
  const matches = await prisma.match.findMany({
    where: { puuid, season: { in: SEASONS } },
    select: { championName: true, season: true },
  });

  if (matches.length === 0) return [];

  const aggregated = aggregateChampionGamesBySeason(matches);
  const top5 = getTop5ChampionsAcrossSeasons(aggregated, isPartial);

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

export async function invalidateChampionStatsCache(puuid: string): Promise<void> {
  await prisma.championSeasonStats.deleteMany({ where: { puuid } });
}
