// riotRankService - Récupère le rang actuel du joueur via League-V4

import type { RiotLeagueEntry, RankInfo, Region } from '@/types';
import { getPlatformBaseUrl, formatRank } from '@/lib/utils';
import { RiotRateLimitError, RiotApiError } from './riotAccountService';

const RIOT_API_KEY = process.env.RIOT_API_KEY!;

/**
 * Récupère les entrées de classement d'un summoner
 * Retourne en priorité le ranked solo/duo, sinon null
 */
export async function getRankBySummonerId(
  summonerId: string,
  region: Region = 'EUW1'
): Promise<RankInfo | null> {
  const baseUrl = getPlatformBaseUrl(region);
  const url = `${baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`;

  const res = await fetch(url, {
    headers: { 'X-Riot-Token': RIOT_API_KEY },
    next: { revalidate: 300 }, // Cache 5 minutes
  });

  if (res.status === 429) throw new RiotRateLimitError('Rate limit Riot');
  if (!res.ok) throw new RiotApiError(`Erreur League-V4: ${res.status}`);

  const entries: RiotLeagueEntry[] = await res.json();

  // Priorité : RANKED_SOLO_5x5
  const solo = entries.find((e) => e.queueType === 'RANKED_SOLO_5x5');
  const flex = entries.find((e) => e.queueType === 'RANKED_TEAM_5x5');
  const entry = solo ?? flex;

  if (!entry) return null;

  const winRate = Math.round((entry.wins / (entry.wins + entry.losses)) * 100);

  return {
    tier: entry.tier,
    rank: entry.rank,
    leaguePoints: entry.leaguePoints,
    wins: entry.wins,
    losses: entry.losses,
    winRate,
  };
}
