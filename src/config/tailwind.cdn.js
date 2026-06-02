tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        slate: {
                            950: '#020408',
                            900: '#080d16',
                            800: '#0c1220',
                            700: '#101828',
                            600: '#182235',
                            500: '#3d4f63',
                            400: '#8292a8',
                            300: '#c8d3e2',
                            200: '#e4ecf7'
                        },
                        primary: { DEFAULT: '#22d3ee', hover: '#67e8f9', glow: 'rgba(34, 211, 238, 0.35)' },
                        accent: { DEFAULT: '#22d3ee', hover: '#67e8f9' },
                        cyber: { DEFAULT: '#22d3ee', hover: '#67e8f9' }
                    },
                    fontFamily: { sans: ['New Science', 'sans-serif'] },
                    animation: {
                        'blob': 'blob 10s infinite',
                        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
                    },
                    keyframes: {
                        blob: {
                            '0%': { transform: 'translate(0px, 0px) scale(1)' },
                            '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
                            '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
                            '100%': { transform: 'translate(0px, 0px) scale(1)' },
                        },
                        fadeInUp: {
                            '0%': { opacity: '0', transform: 'translateY(20px)' },
                            '100%': { opacity: '1', transform: 'translateY(0)' },
                        },
                    }
                }
            }
        }
