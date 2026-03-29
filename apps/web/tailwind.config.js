/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#0C0C0C',
        surface: '#171717',
        input: '#1A1A1A',
        borderPrimary: '#1F1F1F',
        borderSecondary: '#252525',
        textPrimary: '#E5E5E5',
        textSecondary: '#A3A3A3',
        textTertiary: '#737373',
        textMuted: '#525252',
        accent: {
          green: '#22C55E',
          warning: '#F59E0B',
          info: '#3B82F6',
          error: '#EF4444',
          neutral: '#525252',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'page-title': ['32px', '1.3'],
        'metric': ['28px', '1.3'],
        'section-title': ['16px', '1.4'],
        'base': ['13px', '1.4'],
        'small': ['12px', '1.4'],
      }
    },
  },
  plugins: [],
}