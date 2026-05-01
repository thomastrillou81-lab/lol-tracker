import { NextRequest, NextResponse } from 'next/server';
import { parseRiotId, getSeasonDateRanges } from '@/lib/utils';
import { getAccountByRiotId, getSummonerByPuuid, RiotRateLimitError, RiotNotFoundError } from '@/lib/riot/riotAccountService';
import { getRankBySummonerId } from '@/lib/riot/riotRankService';
import { syncMatchesForSeason } from '@/lib/riot/riotMatchService';
import { getOrComputeChampionStats } from '@/lib/riot/championAggregationService';
import { prisma } from '@/lib/db';
import type { ApiResponse, PlayerSummary } from '@/types';

export const maxDuration = 60;
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { riotId: string } }
) {
  try {
    const riotIdParam = decodeURIComponent(params.riotId);
    const parsed = parseRiotId(riotIdParam);

    if (!parsed) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Format de Riot ID invalide', code: 'INVALID_RIOT_ID' },
        { status: 400 }
      );
    }

    const region = (request.nextUrl.searchParams.get('region') ?? 'EUW1') as any;

    // 1. Récupérer le compte
    const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine, region);

    // 2. Invalider le cache champion pour forcer recalcul
    await prisma.championSeasonStats.deleteMany({ where: { puuid: account.puuid } });

    // 3. Sync TOUTES les saisons (toujours, pas de cache sur needsSync)
    const seasonRanges = getSeasonDateRanges();
    let isPartial = false;

    for (const range of seasonRanges) {
      try {
        console.log(`[sync] start season=${range.season}`);
        const result = await syncMatchesForSeason(account.puuid, range, region);
        console.log(`[sync] done season=${range.season}`, result);
        if (result.isPartial) isPartial = true;
      } catch (err) {
        console.error(`[sync] failed season=${range.season}`, err);
        isPartial = true;
      }
    }

    // 4. Upsert joueur APRÈS la sync
    await prisma.player.upsert({
      where: { puuid: account.puuid },
      update: { gameName: account.gameName, tagLine: account.tagLine, region },
      create: { puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine, region },
    });

    // 5. Summoner
    let profileIconId = 1;
    let summonerLevel = 0;
    let summonerId = '';
    try {
      const summoner = await getSummonerByPuuid(account.puuid, region);
      profileIconId = summoner.profileIconId;
      summonerLevel = summoner.summonerLevel;
      summonerId = summoner.id;
    } catch (err) {
      console.warn('Summoner ignoré:', err);
    }

    // 6. Rank
    let rank = null;
    if (summonerId) {
      try {
        rank = await getRankBySummonerId(summonerId, region);
      } catch (err) {
        console.warn('Rank ignoré:', err);
      }
    }

    // 7. Top 5 champions
    const topChampions = await getOrComputeChampionStats(account.puuid, isPartial);

    const response: PlayerSummary = {
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      profileIconId,
      summonerLevel,
      region,
      rank,
      topChampions,
      dataFetchedAt: new Date().toISOString(),
    };

    return NextResponse.json<ApiResponse<PlayerSummary>>({
      success: true,
      data: response,
    });

  } catch (err) {
    if (err instanceof RiotRateLimitError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Rate limit Riot. Réessayez dans quelques secondes.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }
    if (err instanceof RiotNotFoundError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Joueur introuvable.', code: 'PLAYER_NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('Erreur summary:', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Erreur serveur inattendue', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
