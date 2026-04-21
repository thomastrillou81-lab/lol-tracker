'use client';

// Page résultat joueur : affiche le rank, top 5 champions par saison

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import type { PlayerSummary } from '@/types';
import PlayerHeader from '@/components/player/PlayerHeader';
import ChampionCards from '@/components/champion/ChampionCards';
import SummaryTable from '@/components/champion/SummaryTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

export default function PlayerPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const riotId = decodeURIComponent(params.riotId as string);
  const region = searchParams.get('region') ?? 'EUW1';

  const [data, setData] = useState<PlayerSummary | null>(null);
  const [error, setError] = useState<{ message: string; code: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('Connexion au serveur Riot...');

  useEffect(() => {
    const steps = [
      'Récupération du PUUID...',
      'Chargement du rang actuel...',
      'Synchronisation des matchs 2023–2026...',
      'Calcul du top 5 champions...',
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < steps.length - 1) {
        stepIndex++;
        setStep(steps[stepIndex]);
      }
    }, 2500);

    fetch(`/api/player/${encodeURIComponent(riotId)}/summary?region=${region}`)
      .then((res) => res.json())
      .then((json) => {
        clearInterval(interval);
        if (!json.success) {
          setError({ message: json.error, code: json.code });
        } else {
          setData(json.data);
        }
      })
      .catch(() => {
        clearInterval(interval);
        setError({ message: 'Erreur réseau. Vérifiez votre connexion.', code: 'SERVER_ERROR' });
      })
      .finally(() => setLoading(false));

    return () => clearInterval(interval);
  }, [riotId, region]);

  if (loading) return <LoadingState step={step} riotId={riotId} />;

  if (error) {
    return (
      <ErrorState
        message={error.message}
        code={error.code as any}
        onBack={() => router.push('/')}
      />
    );
  }

  if (!data) return null;

  return (
    <main className="min-h-screen">
      {/* Background subtle */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-96 h-96 opacity-5 blur-3xl rounded-full"
          style={{ background: 'var(--gold)' }} />
        <div className="absolute bottom-0 left-0 w-96 h-96 opacity-5 blur-3xl rounded-full"
          style={{ background: 'var(--blue)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-100 opacity-60"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L5.47 8.53a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z"/>
          </svg>
          Retour à la recherche
        </button>

        {/* Player header */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <PlayerHeader player={data} />
        </div>

        {/* Partial data warning */}
        {data.topChampions.some((c) => c.isPartial) && (
          <div className="mt-6 flex items-start gap-3 rounded-lg px-4 py-3 text-sm border"
            style={{ background: 'rgba(251,191,36,0.06)', borderColor: 'rgba(251,191,36,0.2)', color: '#fbbf24' }}>
            <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path fillRule="evenodd" d="M8 0a8 8 0 100 16A8 8 0 008 0zm-.5 4.75a.5.5 0 011 0v4.5a.5.5 0 01-1 0v-4.5zm.5 7.25a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
            </svg>
            <span>
              <strong>Données partielles</strong> — Certaines saisons ont pu être incomplètement synchronisées.
              Les chiffres affichés peuvent ne pas refléter l&apos;intégralité de votre historique.
            </span>
          </div>
        )}

        {/* No matches */}
        {data.topChampions.length === 0 && (
          <div className="mt-8 card p-12 text-center">
            <p className="text-3xl mb-3">🎮</p>
            <p className="font-semibold mb-2">Aucune partie trouvée</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Aucun match ranked solo/duo trouvé sur les saisons 2023–2026.
            </p>
          </div>
        )}

        {/* Champion cards */}
        {data.topChampions.length > 0 && (
          <>
            <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
              <h2 className="text-sm font-mono tracking-widest uppercase mb-5" style={{ color: 'var(--text-muted)' }}>
                Top 5 champions · Ranked Solo Queue
              </h2>
              <ChampionCards champions={data.topChampions} />
            </div>

            <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <h2 className="text-sm font-mono tracking-widest uppercase mb-5" style={{ color: 'var(--text-muted)' }}>
                Tableau récapitulatif
              </h2>
              <SummaryTable champions={data.topChampions} />
            </div>
          </>
        )}

        {/* Footer */}
        <p className="mt-12 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          Données actualisées le {new Date(data.dataFetchedAt).toLocaleString('fr-FR')} · Riot Games API
        </p>
      </div>
    </main>
  );
}
