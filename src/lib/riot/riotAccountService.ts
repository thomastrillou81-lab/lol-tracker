// riotAccountService - Récupère les infos de compte Riot via Account-V1

import type { RiotAccount, RiotSummoner, Region } from '@/types';
import { getRegionalRoute, getRegionalBaseUrl, getPlatformBaseUrl } from '@/lib/utils';

const RIOT_API_KEY = process.env.RIOT_API_KEY!;

if (!RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY manquante dans les variables d\'environnement');
}

/**
 * Wrapper fetch avec headers Riot et gestion d'erreurs
 */
async function riotFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { 'X-Riot-Token': RIOT_API_KEY },
    next: { revalidate: 300 }, // Cache Next.js 5 minutes
  });

  if (res.status === 429) {
    const retryAfter = res.headers.get('Retry-After') ?? '1';
    throw new RiotRateLimitError(`Rate limit Riot atteint. Réessayez dans ${retryAfter}s`);
  }

  if (res.status === 404) {
    throw new RiotNotFoundError('Joueur introuvable');
  }

  if (!res.ok) {
    throw new RiotApiError(`Erreur API Riot: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Erreurs custom ────────────────────────────────────────────────────────────

export class RiotRateLimitError extends Error {
  constructor(message: string) { super(message); this.name = 'RiotRateLimitError'; }
}
export class RiotNotFoundError extends Error {
  constructor(message: string) { super(message); this.name = 'RiotNotFoundError'; }
}
export class RiotApiError extends Error {
  constructor(message: string) { super(message); this.name = 'RiotApiError'; }
}

// ─── Service ───────────────────────────────────────────────────────────────────

/**
 * Récupère le PUUID et les infos de compte à partir du Riot ID (gameName + tagLine)
 * Utilise l'endpoint Account-V1 (régional)
 */
export async function getAccountByRiotId(
  gameName: string,
  tagLine: string,
  region: Region = 'EUW1'
): Promise<RiotAccount> {
  const route = getRegionalRoute(region);
  const baseUrl = getRegionalBaseUrl(route);

  const url = `${baseUrl}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  return riotFetch<RiotAccount>(url);
}

/**
 * Récupère les infos summoner (icône, level, summonerId) à partir du PUUID
 * Utilise l'endpoint Summoner-V4 (plateforme)
 */
export async function getSummonerByPuuid(
  puuid: string,
  region: Region = 'EUW1'
): Promise<RiotSummoner> {
  const baseUrl = getPlatformBaseUrl(region);
  const url = `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`;
  return riotFetch<RiotSummoner>(url);
}
