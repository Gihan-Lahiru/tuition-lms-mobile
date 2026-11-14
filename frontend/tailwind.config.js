/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        app: '0 8px 30px rgba(15, 23, 42, 0.08)',
        sheet: '0 -8px 30px rgba(15, 23, 42, 0.14)',
      },
    },
  },
  plugins: [],
};

