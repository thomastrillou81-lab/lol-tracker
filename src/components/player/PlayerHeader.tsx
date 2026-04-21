// Composant PlayerHeader - Affiche pseudo, icône, level, rank

import Image from 'next/image';
import type { PlayerSummary } from '@/types';
import { getProfileIconUrl, formatRank, RANK_COLORS } from '@/lib/utils';

interface Props {
  player: PlayerSummary;
}

export default function PlayerHeader({ player }: Props) {
  const rankColor = player.rank ? (RANK_COLORS[player.rank.tier] ?? '#9ca3af') : '#525672';
  const profileIconUrl = getProfileIconUrl(player.profileIconId);

  return (
    <div className="card p-6">
      <div className="flex items-center gap-5 flex-wrap">
        {/* Avatar avec badge level */}
        <div className="relative shrink-0">
          <div className="w-20 h-20 rounded-xl overflow-hidden border-2" style={{ borderColor: rankColor + '60' }}>
            <Image
              src={profileIconUrl}
              alt={`Icône de ${player.gameName}`}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = '/default-icon.png'; }}
            />
          </div>
          {/* Level badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold px-2 py-0.5 rounded-full border"
            style={{ background: 'var(--bg-primary)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
            {player.summonerLevel}
          </div>
        </div>

        {/* Infos joueur */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>
              {player.gameName}
            </h1>
            <span className="text-sm font-mono" style={{ color: 'var(--text-muted)' }}>
              #{player.tagLine}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {/* Région badge */}
            <span className="text-xs font-mono px-2 py-0.5 rounded border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'var(--bg-secondary)' }}>
              {player.region}
            </span>

            {/* Rank badge */}
            {player.rank ? (
              <span className="rank-badge" style={{ background: rankColor + '18', color: rankColor, border: `1px solid ${rankColor}40` }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style={{ opacity: 0.8 }}>
                  <path d="M5 0L6.12 3.45H9.76L6.82 5.59L7.94 9.04L5 6.9L2.06 9.04L3.18 5.59L0.24 3.45H3.88L5 0Z"/>
                </svg>
                {formatRank(player.rank.tier, player.rank.rank, player.rank.leaguePoints)}
              </span>
            ) : (
              <span className="rank-badge" style={{ background: '#52567215', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                Non classé
              </span>
            )}
          </div>

          {/* Win/loss */}
          {player.rank && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-4 text-sm">
                <span>
                  <span className="font-semibold" style={{ color: '#4ade80' }}>{player.rank.wins}V</span>
                  <span className="mx-1" style={{ color: 'var(--text-muted)' }}>/</span>
                  <span className="font-semibold" style={{ color: '#f87171' }}>{player.rank.losses}D</span>
                </span>
                <span style={{ color: 'var(--text-secondary)' }}>·</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {player.rank.winRate}% <span style={{ color: 'var(--text-muted)' }}>winrate</span>
                </span>
              </div>

              {/* Mini winrate bar */}
              <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-24" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${player.rank.winRate}%`,
                    background: player.rank.winRate >= 55
                      ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                      : player.rank.winRate >= 50
                        ? 'linear-gradient(90deg, var(--gold), var(--gold-light))'
                        : 'linear-gradient(90deg, #f87171, #ef4444)',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
