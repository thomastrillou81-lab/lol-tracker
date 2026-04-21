// API Route : GET /api/player/[riotId]/summary
// Agrège toutes les données d'un joueur : rank + top 5 champions par saison

import { NextRequest, NextResponse } from 'next/server';
import { parseRiotId, getSeasonDateRanges } from '@/lib/utils';
import { getAccountByRiotId, getSummonerByPuuid, RiotRateLimitError, RiotNotFoundError } from '@/lib/riot/riotAccountService';
import { getRankBySummonerId } from '@/lib/riot/riotRankService';
import { syncMatchesForSeason } from '@/lib/riot/riotMatchService';
import { getOrComputeChampionStats } from '@/lib/riot/championAggregationService';
import { prisma } from '@/lib/db';
import type { ApiResponse, PlayerSummary } from '@/types';

export const revalidate = 600;

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

    // 1. Récupérer le compte (PUUID)
    const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine, region);

    // 2. Vérifier si on a déjà synchronisé récemment (< 30 min)
    const player = await prisma.player.findUnique({ where: { puuid: account.puuid } });
    const THIRTY_MIN = 30 * 60 * 1000;
    const needsSync = !player || Date.now() - player.updatedAt.getTime() > THIRTY_MIN;

    let isPartial = false;

    if (needsSync) {
      const seasonRanges = getSeasonDateRanges();
      const syncResults = await Promise.allSettled(
        seasonRanges.map((range) => syncMatchesForSeason(account.puuid, range, region))
      );
      isPartial = syncResults.some(
        (r) => r.status === 'fulfilled' && r.value.isPartial
      );
      await prisma.player.upsert({
        where: { puuid: account.puuid },
        update: { gameName: account.gameName, tagLine: account.tagLine, region },
        create: { puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine, region },
      });
    }

    // 3. Récupérer les infos summoner (icône, level)
    const summoner = await getSummonerByPuuid(account.puuid, region);

    // 4. Récupérer le rank — optionnel, ne plante pas si erreur
    let rank = null;
    try {
      rank = await getRankBySummonerId(summoner.id, region);
    } catch (err) {
      console.warn('Rank non disponible (ignoré):', err);
    }

    // 5. Calculer le top 5 champions
    const topChampions = await getOrComputeChampionStats(account.puuid, isPartial);

    const response: PlayerSummary = {
      puuid: account.puuid,
      gameName: account.gameName,
      tagLine: account.tagLine,
      profileIconId: summoner.profileIconId,
      summonerLevel: summoner.summonerLevel,
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
        { success: false, error: 'Rate limit Riot atteint. Réessayez dans quelques secondes.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }
    if (err instanceof RiotNotFoundError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Joueur introuvable.', code: 'PLAYER_NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('Erreur /api/player/[riotId]/summary:', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Erreur serveur inattendue', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
