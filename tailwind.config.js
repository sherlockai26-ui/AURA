/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aura: {
          bg: '#0B0C10',
          surface: '#1F2833',
          purple: '#9D4EDD',
          cyan: '#00F5D4',
          text: '#FFFFFF',
          'text-2': '#B0B0B0',
          error: '#FF4D6D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        pill: '30px',
      },
      boxShadow: {
        'glow-purple': '0 0 12px rgba(157, 78, 221, 0.55)',
        'glow-cyan': '0 0 16px rgba(0, 245, 212, 0.45)',
        'inset-purple': 'inset 0 0 0 1px #9D4EDD',
      },
      keyframes: {
        float: {
          '0%': { transform: 'translateY(20vh) translateX(0) scale(1)', opacity: '0' },
          '15%': { opacity: '0.6' },
          '100%': { transform: 'translateY(-110vh) translateX(20px) scale(0.6)', opacity: '0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(157,78,221,0.0)' },
          '50%': { boxShadow: '0 0 18px rgba(157,78,221,0.55)' },
        },
        loaderSlide: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(360%)' },
        },
      },
      animation: {
        float: 'float 14s linear infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        loader: 'loaderSlide 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
