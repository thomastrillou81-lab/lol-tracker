import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-syne)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        gold: '#c4a050',
        'gold-light': '#e8c870',
        'lol-blue': '#4f8ef7',
        'bg-primary': '#0a0b0f',
        'bg-secondary': '#0f1117',
        'bg-card': '#13151d',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease forwards',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
