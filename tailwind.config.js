/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        gameOfSquids: ['"Game of Squids"', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#0D6EFD",
          foreground: "#FFFFFF"
      },
      secondary: {
          DEFAULT: "#F0F1F3",
          foreground: "#020817"
      },
      accent: {
          DEFAULT: "#6D7074",
          foreground: "#020817"
      },
      background: "#FAFAFB",
      foreground: "#020817",
      card: {
          DEFAULT: "#FFFFFF",
          foreground: "#020817"
      },
      popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#020817"
      },
      muted: {
          DEFAULT: "#F0F1F3",
          foreground: "#6D7074"
      },
      destructive: {
          DEFAULT: "#FF4C4C",
          foreground: "#FFFFFF"
      },
      border: "#E0E0E0",
      input: "#E0E0E0",
      ring: "#0D6EFD",
      chart: {
          1: "#FF6F61",
          2: "#4CAF50",
          3: "#03A9F4",
          4: "#FFC107",
          5: "#8E44AD"
      },
      dark: {
          primary: {
              DEFAULT: "#0D6EFD",
              foreground: "#FFFFFF"
          },
          secondary: {
              DEFAULT: "#1E1E2C",
              foreground: "#FAFAFB"
          },
          accent: {
              DEFAULT: "#6D7074",
              foreground: "#FAFAFB"
          },
          background: "#020817",
          foreground: "#FAFAFB",
          card: {
              DEFAULT: "#121212",
              foreground: "#FAFAFB"
          },
          popover: {
              DEFAULT: "#121212",
              foreground: "#FAFAFB"
          },
          muted: {
              DEFAULT: "#1E1E2C",
              foreground: "#6D7074"
          },
          destructive: {
              DEFAULT: "#FF4C4C",
              foreground: "#FFFFFF"
          },
          border: "#3C3C3C",
          input: "#3C3C3C",
          ring: "#0D6EFD"
      }
      },
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
