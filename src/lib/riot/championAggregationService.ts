import type { ChampionSeasonData } from '@/types';
import { prisma } from '@/lib/db';
import { aggregateChampionGamesBySeason, getTop5ChampionsAcrossSeasons } from '@/lib/utils';

const SEASONS = [2026, 2025, 2024, 2023];

export async function getOrComputeChampionStats(
  puuid: string,
  isPartial: boolean = false
): Promise<ChampionSeasonData[]> {
  return computeAndCacheChampionStats(puuid, isPartial);
}

async function computeAndCacheChampionStats(
  puuid: string,
  isPartial: boolean
): Promise<ChampionSeasonData[]> {
  const matches = await prisma.match.findMany({
    where: { puuid, season: { in: SEASONS } },
    select: { championName: true, season: true },
  });

  console.log(`[champ] ${matches.length} matchs trouvés en base pour ${puuid}`);

  if (matches.length === 0) return [];

  const aggregated = aggregateChampionGamesBySeason(matches);
  const top5 = getTop5ChampionsAcrossSeasons(aggregated, isPartial);

  await prisma.$transaction(
    top5.flatMap((champ) =>
      SEASONS.map((season) =>
        prisma.championSeasonStats.upsert({
          where: { puuid_championName_season: { puuid, championName: champ.championName, season } },
          update: { games: champ.games[season] ?? 0, isPartial },
          create: { puuid, championName: champ.championName, season, games: champ.games[season] ?? 0, isPartial },
        })
      )
    )
  );

  return top5;
}

export async function invalidateChampionStatsCache(puuid: string): Promise<void> {
  await prisma.championSeasonStats.deleteMany({ where: { puuid } });
}
