// Composant SummaryTable - Tableau récapitulatif Champions x Saisons

import Image from 'next/image';
import type { ChampionSeasonData } from '@/types';
import { getChampionImageUrl } from '@/lib/utils';

const SEASONS = [2026, 2025, 2024, 2023];

interface Props {
  champions: ChampionSeasonData[];
}

export default function SummaryTable({ champions }: Props) {
  const maxTotal = Math.max(...champions.map((c) => c.total));

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full stats-table">
          <thead>
            <tr style={{ background: 'var(--bg-secondary)' }}>
              <th className="text-left">#</th>
              <th className="text-left">Champion</th>
              {SEASONS.map((s) => (
                <th key={s} className="text-center">{s}</th>
              ))}
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {champions.map((champ, index) => {
              const imgUrl = getChampionImageUrl(champ.championName);

              return (
                <tr key={champ.championName} className="group transition-colors">
                  {/* Rank */}
                  <td>
                    <span className="text-sm font-bold font-mono" style={{ color: index === 0 ? 'var(--gold)' : 'var(--text-muted)' }}>
                      {index + 1}
                    </span>
                  </td>

                  {/* Champion */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg overflow-hidden border shrink-0" style={{ borderColor: 'var(--border)' }}>
                        <Image
                          src={imgUrl}
                          alt={champ.championName}
                          width={36}
                          height={36}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/default-champion.png'; }}
                        />
                      </div>
                      <span className="font-semibold text-sm">{champ.championName}</span>
                      {champ.isPartial && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(251,191,36,0.1)', color: '#fbbf24' }}>
                          partiel
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Par saison */}
                  {SEASONS.map((season) => {
                    const games = champ.games[season] ?? 0;
                    return (
                      <td key={season} className="text-center">
                        {games > 0 ? (
                          <span className="font-mono font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {games}
                          </span>
                        ) : (
                          <span className="font-mono text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Total avec mini barre */}
                  <td>
                    <div className="flex items-center justify-end gap-3">
                      <div className="w-16 h-1 rounded-full overflow-hidden hidden sm:block" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(champ.total / maxTotal) * 100}%`,
                            background: 'linear-gradient(90deg, var(--gold), var(--gold-light))',
                          }}
                        />
                      </div>
                      <span className="font-bold font-mono text-sm" style={{ color: 'var(--gold)' }}>
                        {champ.total}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
