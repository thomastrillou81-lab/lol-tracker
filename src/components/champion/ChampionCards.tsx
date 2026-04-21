// Composant ChampionCards - Affiche les cards des 5 champions les plus joués

import Image from 'next/image';
import type { ChampionSeasonData } from '@/types';
import { getChampionImageUrl } from '@/lib/utils';

const SEASONS = [2026, 2025, 2024, 2023];

interface Props {
  champions: ChampionSeasonData[];
}

function SeasonBar({ games, max }: { games: number; max: number }) {
  const pct = max > 0 ? (games / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="champion-bar h-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right shrink-0" style={{ color: games > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {games > 0 ? games : '—'}
      </span>
    </div>
  );
}

export default function ChampionCards({ champions }: Props) {
  // Trouver le max global pour normaliser les barres
  const maxGames = Math.max(...champions.flatMap((c) => Object.values(c.games)));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {champions.map((champ, index) => {
        const imgUrl = getChampionImageUrl(champ.championName);

        return (
          <div
            key={champ.championName}
            className="card p-5 relative overflow-hidden group animate-fade-in-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Rank number */}
            <div className="absolute top-4 right-4 text-4xl font-extrabold leading-none"
              style={{ color: index === 0 ? 'rgba(196,160,80,0.12)' : 'rgba(255,255,255,0.04)', fontFamily: 'var(--font-display)' }}>
              {index + 1}
            </div>

            <div className="flex items-center gap-4 mb-5">
              {/* Champion image */}
              <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border" style={{ borderColor: 'var(--border)' }}>
                <Image
                  src={imgUrl}
                  alt={champ.championName}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/default-champion.png'; }}
                />
              </div>

              <div className="min-w-0">
                {/* Rank badge pour le #1 */}
                {index === 0 && (
                  <span className="text-xs font-mono mb-0.5 block" style={{ color: 'var(--gold)' }}>
                    ★ Main
                  </span>
                )}
                <h3 className="font-bold text-base truncate">{champ.championName}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-lg font-extrabold" style={{ color: 'var(--gold)' }}>{champ.total}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>parties</span>
                </div>
              </div>
            </div>

            {/* Season breakdown */}
            <div className="space-y-3">
              {SEASONS.map((season) => (
                <div key={season} className="flex items-center gap-3">
                  <span className="text-xs font-mono w-8 shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {season}
                  </span>
                  <SeasonBar games={champ.games[season] ?? 0} max={maxGames} />
                </div>
              ))}
            </div>

            {/* Partial data indicator */}
            {champ.isPartial && (
              <div className="mt-3 text-xs flex items-center gap-1" style={{ color: '#fbbf24' }}>
                <span>⚠</span> données partielles
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
