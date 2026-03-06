// eslint-disable-next-line @typescript-eslint/no-var-requires
const plugin = require('tailwindcss/plugin')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { heroui } = require('@heroui/theme')

/**
 * Elevation System:
 * Level 0: No shadow (flat elements)
 * Level 1: shadow-xs (cards, list items)
 * Level 2: shadow-md (dropdowns, popovers)
 * Level 3: shadow-lg (modals, drawers)
 * Level 4: shadow-xl (critical overlays)
 *
 * Border Radius System:
 * Buttons/Inputs: rounded (0.25rem)
 * Cards: rounded-lg (0.5rem)
 * Modals/Drawers: rounded-xl (0.75rem)
 */

// disable nó ở đây để có thể biết được gì mà không có gì mà phải hông

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  mode: 'jit',
  // purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // HeroUI theme content path — required for Tailwind to generate HeroUI component classes.
    // With Tailwind v4 + @tailwindcss/vite, content detection is automatic from the module graph,
    // but this explicit path ensures all HeroUI theme classes are available.
    './node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}'
  ],
  corePlugins: {
    container: false // xóa cái container ra khỏi tailwind
  },
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#ee4d2d',
          50: '#FFF5F2',
          100: '#FFE8E2',
          200: '#FFCFC4',
          300: '#FFB09D',
          400: '#FF8A6B',
          500: '#FF6B47',
          600: '#EE4D2D',
          700: '#D73211',
          800: '#B02A0E',
          900: '#8A210B',
          950: '#431407'
        },
        white: '#ffffff',
        // Dark mode colors
        'dark-bg': '#0f172a',
        'dark-surface': '#1e293b',
        'dark-text': '#e4e4e7',
        'dark-text-secondary': '#a1a1aa',
        // Semantic tokens from CSS variables
        input: {
          bg: 'rgb(var(--color-input-bg))',
          border: 'rgb(var(--color-input-border))',
          text: 'rgb(var(--color-input-text))',
          placeholder: 'rgb(var(--color-input-placeholder))'
        },
        modal: {
          bg: 'rgb(var(--color-modal-bg))',
          overlay: 'rgb(var(--color-modal-overlay))',
          border: 'rgb(var(--color-modal-border))'
        },
        card: {
          bg: 'rgb(var(--color-card-bg))',
          border: 'rgb(var(--color-card-border))',
          hover: 'rgb(var(--color-card-hover))'
        },
        tooltip: {
          bg: 'rgb(var(--color-tooltip-bg))',
          text: 'rgb(var(--color-tooltip-text))'
        },
        badge: {
          bg: 'rgb(var(--color-badge-bg))',
          text: 'rgb(var(--color-badge-text))'
        }
      },

      keyframes: {
        loader: {
          to: {
            opacity: 0.1,
            transform: 'translate3d(0, -1rem, 0)'
          }
        },
        'slide-top': {
          '0%': {
            '-webkit-transform': 'translateY(20px)s',
            transform: 'translateY(20px)'
          },
          '100%': {
            ' -webkit-transform': 'translateY(0px)',
            transform: 'translateY(0px)'
          }
        },
        'slide-top-sm': {
          '0%': {
            '-webkit-transform': 'translateY(6px)s',
            transform: 'translateY(6px)'
          },
          '100%': {
            ' -webkit-transform': 'translateY(0px)',
            transform: 'translateY(0px)'
          }
        },

        'slide-right': {
          '0%': {
            '-webkit-transform': 'translateX(-1000px)',
            transform: 'translateX(-1000px)'
          },
          '100%': {
            '-webkit-transform': 'translateX(0px)',
            transform: 'translateX(0px)'
          }
        },
        'bell-shake': {
          '0%, 50%, 100%': {
            transform: 'rotate(0deg)'
          },
          '10%, 30%': {
            transform: 'rotate(-10deg)'
          },
          '20%, 40%': {
            transform: 'rotate(10deg)'
          }
        },
        'fade-in': {
          '0%': {
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'fade-in-up': {
          '0%': {
            opacity: '0',
            transform: 'translateY(10px)'
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)'
          }
        },
        'scale-in': {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)'
          }
        }
      },
      animation: {
        loader: 'loader 0.6s infinite alternate',
        'slide-top': 'slide-top 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both',
        'slide-top-sm': 'slide-top-sm 0.1s linear both',
        'slide-right': 'slide-right 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both',
        'bell-shake': 'bell-shake 1s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.2s ease-out forwards'
      }
    }
  },
  plugins: [
    // tạo ra 1 cái container mới
    plugin(function ({ addComponents, theme }) {
      addComponents({
        '.container': {
          maxHeight: theme('columns.8xl'),
          maxWidth: theme('columns.7xl'),
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: theme('spacing.4'),
          paddingRight: theme('spacing.4')
        }
      })
    }),
    // Utility class để ẩn scrollbar
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }),
    // @tailwindcss/line-clamp đã được tích hợp mặc định từ Tailwind CSS v3.3+
    heroui({
      themes: {
        light: {
          colors: {
            background: '#f5f5f5',
            foreground: '#11181C'
          }
        },
        dark: {
          colors: {
            background: '#0f172a',
            foreground: '#ECEDEE'
          }
        }
      }
    })
  ],
  variants: {
    extends: {}
  }
}
