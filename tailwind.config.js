/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      keyframes: {
        'fade-in-right': {
          '0%': {
            opacity: '0',
            transform: 'translateX(-20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'fade-in-left': {
          '0%': {
            opacity: '0',
            transform: 'translateX(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        'fade-in-top': {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        "rotate-360": {
        "0%": {
        "transform": "rotate(0deg)"
       },
       "100%": {
      "transform": "rotate(360deg)"
    }
  },
  'fade-in-bottom': {
    '0%': {
      opacity: '0',
      transform: 'translateY(20px)',
    },
    '100%': {
    opacity: '1',
    transform: 'translateY(0)',
    }
  },
        
      },
      animation: {
        'fade-in-right': 'fade-in-right 0.6s ease-in-out',
        'fade-in-left': 'fade-in-left 0.6s ease-in-out',
        'fade-in-top': 'fade-in-top 0.6s ease-in-out',
        'fade-in-bottom': 'fade-in-bottom 0.6 ease-in-out',
        "rotate-360": "rotate-360 1s linear",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
