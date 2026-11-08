/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dawat: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#0F5132', // Emerald / Forest Green brand primary
          900: '#0A3622', // Deep Forest brand dark
          950: '#052014'
        }
      },
      fontFamily: {
        urdu: ['"Noto Nastaliq Urdu"', '"Noto Sans Arabic"', '"Segoe UI"', 'Tahoma', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
