// Layout racine Next.js 14 avec metadata et font

import type { Metadata } from 'next';
import { Syne, Space_Mono } from 'next/font/google';
import './globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  weight: ['400', '600', '700', '800'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'LoL Tracker — Analyse tes saisons',
  description: 'Analyse ton historique League of Legends : top 5 champions par saison, rank actuel, stats détaillées.',
  keywords: ['League of Legends', 'LoL tracker', 'champion stats', 'rank', 'saison'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${syne.variable} ${spaceMono.variable}`}>
      <body className="bg-[#0a0b0f] text-[#e8e8f0] antialiased">{children}</body>
    </html>
  );
}
