// Types TypeScript pour le projet League of Legends Tracker

// ─── Riot API Types ────────────────────────────────────────────────────────────

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  id: string;
  accountId: string;
  puuid: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface RiotLeagueEntry {
  leagueId: string;
  summonerId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  hotStreak: boolean;
  veteran: boolean;
  freshBlood: boolean;
  inactive: boolean;
}

export interface RiotMatchParticipant {
  puuid: string;
  championName: string;
  championId: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  teamPosition: string;
}

export interface RiotMatchInfo {
  gameCreation: number;
  gameDuration: number;
  queueId: number;
  gameMode: string;
  participants: RiotMatchParticipant[];
}

export interface RiotMatch {
  metadata: { matchId: string; participants: string[] };
  info: RiotMatchInfo;
}

// ─── App Types ─────────────────────────────────────────────────────────────────

export type Region = 'EUW1' | 'EUN1' | 'NA1' | 'KR' | 'BR1' | 'LA1' | 'LA2' | 'OC1' | 'TR1' | 'RU' | 'JP1';
export type RegionalRoute = 'EUROPE' | 'AMERICAS' | 'ASIA' | 'SEA';

export interface ParsedRiotId {
  gameName: string;
  tagLine: string;
}

export interface SeasonDateRange {
  season: number;
  startTimestamp: number; // Unix seconds
  endTimestamp: number;   // Unix seconds
}

export interface ChampionSeasonData {
  championName: string;
  games: Record<number, number>; // season -> games count
  total: number;
  isPartial: boolean;
}

export interface PlayerSummary {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  summonerLevel: number;
  region: string;
  rank: RankInfo | null;
  topChampions: ChampionSeasonData[];
  dataFetchedAt: string;
}

export interface RankInfo {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate: number;
}

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code: 'INVALID_RIOT_ID' | 'PLAYER_NOT_FOUND' | 'RATE_LIMIT' | 'RIOT_API_ERROR' | 'SERVER_ERROR';
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
