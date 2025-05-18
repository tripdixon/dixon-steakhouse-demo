/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: '#8B0000',
        charcoal: '#333333',
        cream: '#F5F5DC',
        gold: '#D4AF37',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        highlight: 'highlight 5s ease-in-out',
      },
      keyframes: {
        highlight: {
          '0%': { backgroundColor: 'rgba(212, 175, 55, 0.3)' },
          '100%': { backgroundColor: 'rgba(255, 255, 255, 0)' },
        },
      },
    },
  },
  plugins: [],
};