// Composant LoadingState - État de chargement pendant la récupération des données

interface Props {
  step: string;
  riotId: string;
}

export default function LoadingState({ step, riotId }: Props) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Animated logo */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-2 opacity-20 animate-ping" style={{ borderColor: 'var(--gold)' }} />
          <div className="absolute inset-2 rounded-full border-2 opacity-40" style={{ borderColor: 'var(--gold)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="spinner" />
          </div>
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Analyse en cours
        </h2>

        <p className="font-mono text-sm mb-2" style={{ color: 'var(--gold)' }}>
          {riotId}
        </p>

        <p className="text-sm transition-all duration-300" style={{ color: 'var(--text-secondary)' }}>
          {step}
        </p>

        <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          La première analyse peut prendre jusqu&apos;à 30 secondes selon la taille de l&apos;historique.
        </p>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-8">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{
                background: 'var(--gold)',
                animationDelay: `${i * 200}ms`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
