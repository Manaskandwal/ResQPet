/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './index.html',
        './src/**/*.{js,ts,jsx,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                // Brand Colors - using CSS variables
                primary: {
                    DEFAULT: 'var(--brand-primary)',
                    dark: 'var(--brand-primary-dark)',
                    dim: 'var(--brand-primary-dim)',
                    rgb: 'var(--brand-primary-rgb)',
                },
                brand: {
                    DEFAULT: 'var(--brand-primary)',
                    dark: 'var(--brand-primary-dark)',
                    dim: 'var(--brand-primary-dim)',
                    rgb: 'var(--brand-primary-rgb)',
                },

                // Background Colors - using CSS variables
                background: 'var(--bg-main)',
                surface: {
                    DEFAULT: 'var(--bg-surface)',
                    hover: 'var(--bg-surface-hover)',
                    elevated: 'var(--bg-surface-elevated)',
                },
                'surface-card': 'var(--bg-surface)',
                'surface-hover': 'var(--bg-surface-hover)',

                // Text Colors - using CSS variables
                'on-background': 'var(--text-main)',
                'on-surface': 'var(--text-on-surface)',
                'surface-muted': 'var(--text-muted)',

                // Border Colors - using CSS variables
                'surface-border': 'var(--border-surface)',
                'border-subtle': 'var(--border-subtle)',

                // Semantic Colors - using CSS variables
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                error: 'var(--color-error)',
                info: 'var(--color-info)',

                // Legacy primary scale (for specific use cases)
                primary: {
                    50: '#f0fdfa',
                    100: '#ccfbf1',
                    200: '#99f6e4',
                    300: '#5eead4',
                    400: '#2dd4bf',
                    500: '#14b8a6',
                    600: '#0d9488',
                    700: '#0f766e',
                    800: '#115e59',
                    900: '#134e4a',
                },

                // Accent colors (for specific use cases)
                accent: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
            },

            borderRadius: {
                card: '16px',
                btn: '10px',
            },

            boxShadow: {
                card: 'var(--shadow-card)',
                'card-hover': 'var(--shadow-card-hover)',
                toast: '0 8px 24px 0 rgba(0,0,0,0.15)',
                soft: 'var(--shadow-soft)',
                sm: 'var(--shadow-sm)',
            },

            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                headline: ['Manrope', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },

            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.3s ease-out',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                'spin-slow': 'spin 3s linear infinite',
            },

            keyframes: {
                fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
                slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
            },
        },
    },
    plugins: [],
};