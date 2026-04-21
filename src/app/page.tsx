'use client';

// Page d'accueil avec la barre de recherche Riot ID

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { parseRiotId } from '@/lib/utils';

const REGIONS = [
  { value: 'EUW1', label: 'EUW' },
  { value: 'EUN1', label: 'EUNE' },
  { value: 'NA1', label: 'NA' },
  { value: 'KR', label: 'KR' },
  { value: 'BR1', label: 'BR' },
  { value: 'JP1', label: 'JP' },
];

export default function HomePage() {
  const router = useRouter();
  const [riotId, setRiotId] = useState('');
  const [region, setRegion] = useState('EUW1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');

    if (!riotId.trim()) {
      setError('Entrez un Riot ID');
      return;
    }

    const parsed = parseRiotId(riotId);
    if (!parsed) {
      setError('Format invalide. Exemple : seyzo#EUW');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/player/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riotId, region }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error ?? 'Une erreur est survenue');
        return;
      }

      // Rediriger vers la page du joueur
      const encodedRiotId = encodeURIComponent(riotId.trim());
      router.push(`/player/${encodedRiotId}?region=${region}`);
    } catch {
      setError('Erreur de connexion. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, [riotId, region, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(196,160,80,0.04) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px]"
          style={{ background: 'radial-gradient(circle, rgba(79,142,247,0.04) 0%, transparent 70%)' }} />
        {/* Subtle grid lines */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L10 6H15L11 9.5L12.5 14.5L8 11.5L3.5 14.5L5 9.5L1 6H6L8 1Z" fill="#0a0b0f"/>
            </svg>
          </div>
          <span className="font-bold text-sm tracking-widest uppercase" style={{ color: 'var(--gold)' }}>LoL Tracker</span>
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>v1.0 · EUW</span>
      </header>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-2xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-8 border text-xs font-mono tracking-widest uppercase"
            style={{ borderColor: 'var(--border-accent)', color: 'var(--gold)', background: 'rgba(196,160,80,0.06)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--gold)' }} />
            Ranked Solo Queue · Saisons 2023–2026
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold leading-none mb-4 tracking-tight">
            <span style={{ color: 'var(--text-primary)' }}>Analyse tes</span>
            <br />
            <span className="gold-gradient">4 saisons</span>
          </h1>

          <p className="text-lg mb-12 max-w-md mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Découvre tes 5 champions les plus joués sur les saisons 2023 à 2026, avec le détail par année.
          </p>

          {/* Search form */}
          <div className="relative">
            <div className="flex gap-2 mb-2">
              {/* Region selector */}
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="input-search px-3 py-4 text-sm font-mono min-w-[80px] cursor-pointer"
                style={{ color: 'var(--gold)' }}
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value} style={{ background: 'var(--bg-card)' }}>
                    {r.label}
                  </option>
                ))}
              </select>

              {/* Riot ID input */}
              <input
                type="text"
                value={riotId}
                onChange={(e) => { setRiotId(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="gameName#tagLine"
                className="input-search flex-1 px-5 py-4 text-base"
                spellCheck={false}
                autoComplete="off"
                aria-label="Riot ID"
              />

              {/* Search button */}
              <button
                onClick={() => handleSearch()}
                disabled={loading}
                className="btn-primary px-7 py-4 text-sm tracking-wide whitespace-nowrap"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin block" />
                    Analyse...
                  </span>
                ) : 'Analyser →'}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: '#f87171' }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path fillRule="evenodd" d="M7 0a7 7 0 100 14A7 7 0 007 0zm-.75 3.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 7a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            {/* Hint */}
            <p className="mt-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
              Exemple · <button onClick={() => setRiotId('Faker#KR1')} className="underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: 'var(--text-secondary)' }}>Faker#KR1</button>
              {' '}ou{' '}
              <button onClick={() => setRiotId('seyzo#euw')} className="underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: 'var(--text-secondary)' }}>seyzo#euw</button>
            </p>
          </div>
        </div>

        {/* Stats preview cards */}
        <div className="mt-20 grid grid-cols-3 gap-4 max-w-lg w-full mx-auto opacity-60">
          {[
            { label: 'Champions analysés', value: '170+' },
            { label: 'Saisons couvertes', value: '4 ans' },
            { label: 'Données en cache', value: 'Oui' },
          ].map((stat) => (
            <div key={stat.label} className="card p-4 text-center">
              <div className="text-xl font-bold mb-1" style={{ color: 'var(--gold)' }}>{stat.value}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs" style={{ color: 'var(--text-muted)' }}>
        <p>LoL Tracker n&apos;est pas affilié à Riot Games · Données via l&apos;API officielle Riot</p>
      </footer>
    </main>
  );
}
