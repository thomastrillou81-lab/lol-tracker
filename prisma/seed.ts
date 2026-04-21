// prisma/seed.ts - Données de test pour le développement local
// Exécuter avec : npx ts-node prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Joueur de test
  const player = await prisma.player.upsert({
    where: { puuid: 'test-puuid-12345' },
    update: {},
    create: {
      puuid: 'test-puuid-12345',
      gameName: 'TestPlayer',
      tagLine: 'EUW',
      region: 'EUW1',
    },
  });

  console.log(`✅ Player créé : ${player.gameName}#${player.tagLine}`);

  // Matchs de test pour 2026
  const testMatches = [
    { championName: 'Jinx', season: 2026 },
    { championName: 'Jinx', season: 2026 },
    { championName: "Kai'Sa", season: 2026 },
    { championName: 'Jinx', season: 2025 },
    { championName: "Kai'Sa", season: 2025 },
    { championName: 'Ezreal', season: 2024 },
    { championName: 'Jinx', season: 2023 },
  ];

  for (let i = 0; i < testMatches.length; i++) {
    const m = testMatches[i];
    await prisma.match.upsert({
      where: {
        matchId_puuid: {
          matchId: `EUW1_TEST_${i}`,
          puuid: player.puuid,
        },
      },
      update: {},
      create: {
        matchId: `EUW1_TEST_${i}`,
        puuid: player.puuid,
        gameCreation: new Date(`${m.season}-06-15`),
        championName: m.championName,
        queueId: 420,
        season: m.season,
      },
    });
  }

  console.log(`✅ ${testMatches.length} matchs de test créés`);
  console.log('🌱 Seed terminé !');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
