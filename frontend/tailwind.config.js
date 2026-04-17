/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0f1a',
        panel: '#111827',
        'panel-2': '#0f172a',
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        muted: '#94a3b8',
      },
      boxShadow: {
        glow: '0 20px 60px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        xl: '18px',
      },
    },
  },
  plugins: [],
};
