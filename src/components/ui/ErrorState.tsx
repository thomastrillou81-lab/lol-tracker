// Composant ErrorState - Gestion des erreurs avec messages contextuels

interface Props {
  message: string;
  code: 'INVALID_RIOT_ID' | 'PLAYER_NOT_FOUND' | 'RATE_LIMIT' | 'RIOT_API_ERROR' | 'SERVER_ERROR';
  onBack: () => void;
}

const ERROR_CONFIG = {
  INVALID_RIOT_ID: {
    emoji: '✏️',
    title: 'Riot ID invalide',
    hint: 'Le format attendu est gameName#tagLine. Exemple : seyzo#EUW',
  },
  PLAYER_NOT_FOUND: {
    emoji: '🔍',
    title: 'Joueur introuvable',
    hint: 'Vérifiez l\'orthographe et la région sélectionnée.',
  },
  RATE_LIMIT: {
    emoji: '⏳',
    title: 'Trop de requêtes',
    hint: 'L\'API Riot limite les appels. Attendez quelques secondes puis réessayez.',
  },
  RIOT_API_ERROR: {
    emoji: '⚡',
    title: 'Erreur API Riot',
    hint: 'Les serveurs Riot semblent rencontrer un problème. Réessayez dans un moment.',
  },
  SERVER_ERROR: {
    emoji: '🛠',
    title: 'Erreur serveur',
    hint: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
  },
};

export default function ErrorState({ message, code, onBack }: Props) {
  const config = ERROR_CONFIG[code] ?? ERROR_CONFIG.SERVER_ERROR;

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-6">{config.emoji}</div>

        <h2 className="text-2xl font-bold mb-2">{config.title}</h2>

        <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>{config.hint}</p>

        <button
          onClick={onBack}
          className="btn-primary px-8 py-3 text-sm"
        >
          ← Retour à la recherche
        </button>
      </div>
    </main>
  );
}
