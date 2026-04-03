/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffb000',
        'background-dark': '#0a0a0f'
      }
    }
  },
  plugins: []
};
