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
        { success: false, error: 'Format invalide', code: 'INVALID_RIOT_ID' },
        { status: 400 }
      );
    }

    const region = (request.nextUrl.searchParams.get('region') ?? 'EUW1') as any;
    const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine, region);

    // Sync une saison à la fois avec timeout de 12s chacune
    const seasonRanges = getSeasonDateRanges();
    let isPartial = false;

    for (const range of seasonRanges) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 12000);
        console.log(`[sync] season=${range.season} start`);
        const result = await syncMatchesForSeason(account.puuid, range, region);
        clearTimeout(timeout);
        console.log(`[sync] season=${range.season} synced=${result.synced} partial=${result.isPartial}`);
        if (result.isPartial) isPartial = true;
      } catch (err) {
        console.error(`[sync] season=${range.season} error:`, err);
        isPartial = true;
      }
    }

    // Upsert joueur après sync
    await prisma.player.upsert({
      where: { puuid: account.puuid },
      update: { gameName: account.gameName, tagLine: account.tagLine, region },
      create: { puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine, region },
    });

    // Summoner
    let profileIconId = 1, summonerLevel = 0, summonerId = '';
    try {
      const summoner = await getSummonerByPuuid(account.puuid, region);
      profileIconId = summoner.profileIconId;
      summonerLevel = summoner.summonerLevel;
      summonerId = summoner.id;
    } catch (err) { console.warn('Summoner ignoré'); }

    // Rank
    let rank = null;
    if (summonerId) {
      try { rank = await getRankBySummonerId(summonerId, region); }
      catch (err) { console.warn('Rank ignoré'); }
    }

    // Top 5
    const topChampions = await getOrComputeChampionStats(account.puuid, isPartial);

    return NextResponse.json<ApiResponse<PlayerSummary>>({
      success: true,
      data: {
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,
        profileIconId,
        summonerLevel,
        region,
        rank,
        topChampions,
        dataFetchedAt: new Date().toISOString(),
      },
    });

  } catch (err) {
    if (err instanceof RiotRateLimitError) return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Rate limit Riot.', code: 'RATE_LIMIT' }, { status: 429 });
    if (err instanceof RiotNotFoundError) return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Joueur introuvable.', code: 'PLAYER_NOT_FOUND' }, { status: 404 });
    console.error('Erreur summary:', err);
    return NextResponse.json<ApiResponse<never>>({ success: false, error: 'Erreur serveur inattendue', code: 'SERVER_ERROR' }, { status: 500 });
  }
}
