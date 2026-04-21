import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Player" ("id" TEXT NOT NULL,"puuid" TEXT NOT NULL,"gameName" TEXT NOT NULL,"tagLine" TEXT NOT NULL,"region" TEXT NOT NULL DEFAULT 'EUW1',"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Player_pkey" PRIMARY KEY ("id"));`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Player_puuid_key" ON "Player"("puuid");`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Match" ("id" TEXT NOT NULL,"matchId" TEXT NOT NULL,"puuid" TEXT NOT NULL,"gameCreation" TIMESTAMP(3) NOT NULL,"championName" TEXT NOT NULL,"queueId" INTEGER NOT NULL,"season" INTEGER NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Match_pkey" PRIMARY KEY ("id"));`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Match_matchId_puuid_key" ON "Match"("matchId", "puuid");`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Match_puuid_season_idx" ON "Match"("puuid", "season");`);
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "ChampionSeasonStats" ("id" TEXT NOT NULL,"puuid" TEXT NOT NULL,"championName" TEXT NOT NULL,"season" INTEGER NOT NULL,"games" INTEGER NOT NULL DEFAULT 0,"isPartial" BOOLEAN NOT NULL DEFAULT false,"updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ChampionSeasonStats_pkey" PRIMARY KEY ("id"));`);
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "ChampionSeasonStats_puuid_championName_season_key" ON "ChampionSeasonStats"("puuid", "championName", "season");`);
    return NextResponse.json({ success: true, message: '✅ Base de données initialisée !' });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
