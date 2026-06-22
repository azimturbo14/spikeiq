import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0B0F',
        surface: '#12141A',
        card: '#1A1D26',
        primary: '#FFFFFF',
        secondary: '#8B8FA8',
        muted: '#4A4D5E',
        spike: {
          DEFAULT: '#00E5A0',
          hover: '#00C98D',
          glow: 'rgba(0, 229, 160, 0.28)',
        },
        danger: '#FF5A6B',
        warning: '#F5B84B',
        info: '#3BA7FF',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0, 229, 160, 0.22), 0 0 42px rgba(0, 229, 160, 0.16)',
        card: '0 24px 80px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}

export default config
