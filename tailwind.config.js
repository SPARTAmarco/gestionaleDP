/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49',
                },
                dark: {
                    bg: '#0f172a',
                    surface: '#1e293b',
                    text: '#f8fafc',
                    muted: '#94a3b8',
                    border: '#334155'
                },
                // Enhanced employee color palette
                employee: {
                    azure: '#3B82F6',
                    coral: '#EF4444',
                    emerald: '#10B981',
                    amber: '#F59E0B',
                    violet: '#8B5CF6',
                    rose: '#EC4899',
                    cyan: '#06B6D4',
                    lime: '#84CC16',
                    indigo: '#6366F1',
                    pink: '#F472B6',
                    teal: '#14B8A6',
                    orange: '#FB923C'
                }
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'shimmer': 'shimmer 2s linear infinite',
                'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
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
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-1000px 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                bounceSubtle: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-5px)' },
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.9)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                }
            },
            backgroundImage: {
                'shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            }
        },
    },
    plugins: [],
}