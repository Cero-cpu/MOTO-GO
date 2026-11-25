/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './admin/index.html', './src/**/*.js'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#f4b400', glow: '#ffcb1a', dark: '#cc9600' },
        dark: { DEFAULT: '#0a0a0c', card: '#121318', surface: '#1a1b22', border: '#2a2c38' },
      },
      fontFamily: {
        sans: ['Barlow', 'Barlow-fallback', 'system-ui', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'Barlow-Condensed-fallback', 'Arial Narrow', 'sans-serif'],
      },
    },
  },
};
