/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Reddit-inspired color palette
        reddit: {
          orange: '#ff4500',
          blue: '#0079d3',
          dark: '#0a0a0a',
          gray: {
            900: '#0a0a0a',
            800: '#1a1a1a',
            700: '#2d2d2d',
            600: '#333333',
            500: '#666666',
            400: '#b3b3b3',
          }
        },
        // Custom accent colors
        accent: {
          orange: '#ff4500',
          blue: '#0079d3',
          green: '#46d160',
          red: '#ea0027',
        },
        // Dark theme colors
        dark: {
          bg: {
            primary: '#0a0a0a',
            secondary: '#1a1a1a',
            tertiary: '#2d2d2d',
            hover: '#333333',
          },
          text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
            muted: '#666666',
          },
          border: '#343536',
        }
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      boxShadow: {
        'reddit': '0 2px 4px rgba(0, 0, 0, 0.3)',
        'reddit-lg': '0 4px 8px rgba(0, 0, 0, 0.4)',
        'reddit-xl': '0 8px 16px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
}