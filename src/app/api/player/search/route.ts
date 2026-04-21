// API Route : POST /api/player/search
// Valide le Riot ID et retourne le PUUID + infos de base

import { NextRequest, NextResponse } from 'next/server';
import { parseRiotId } from '@/lib/utils';
import { getAccountByRiotId, RiotRateLimitError, RiotNotFoundError } from '@/lib/riot/riotAccountService';
import { prisma } from '@/lib/db';
import type { ApiResponse } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { riotId, region = 'EUW1' } = body as { riotId: string; region?: string };

    // 1. Validation du format Riot ID
    const parsed = parseRiotId(riotId);
    if (!parsed) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Format de Riot ID invalide. Utilisez le format gameName#tagLine', code: 'INVALID_RIOT_ID' },
        { status: 400 }
      );
    }

    // 2. Récupérer le compte Riot
    const account = await getAccountByRiotId(parsed.gameName, parsed.tagLine, region as any);

    // 3. Upsert en base (mise à jour si le joueur existe déjà)
    await prisma.player.upsert({
      where: { puuid: account.puuid },
      update: { gameName: account.gameName, tagLine: account.tagLine, region },
      create: { puuid: account.puuid, gameName: account.gameName, tagLine: account.tagLine, region },
    });

    // 4. Retourner les infos de base pour rediriger vers la page résultat
    return NextResponse.json<ApiResponse<{ puuid: string; gameName: string; tagLine: string }>>({
      success: true,
      data: {
        puuid: account.puuid,
        gameName: account.gameName,
        tagLine: account.tagLine,
      },
    });
  } catch (err) {
    if (err instanceof RiotRateLimitError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Trop de requêtes. Attendez quelques secondes.', code: 'RATE_LIMIT' },
        { status: 429 }
      );
    }
    if (err instanceof RiotNotFoundError) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: 'Joueur introuvable. Vérifiez votre Riot ID.', code: 'PLAYER_NOT_FOUND' },
        { status: 404 }
      );
    }
    console.error('Erreur /api/player/search:', err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: 'Erreur serveur inattendue', code: 'SERVER_ERROR' },
      { status: 500 }
    );
  }
}
