/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'dedsec': {
          'black': '#0a0a0f',
          'dark': '#13131a',
          'darker': '#08080c',
          'gray': '#1a1a24',
          'border': '#2a2a3a',
          'text': '#e8e8f0',
          'muted': '#7a7a8a',
        },
        'neon': {
          'green': '#00ff9f',
          'cyan': '#00d9ff',
          'pink': '#ff006e',
          'orange': '#ff6b00',
          'yellow': '#ffe600',
          'purple': '#b400ff',
        },
        'free': {
          'rave': '#ff006e',
          'acid': '#00ff9f',
          'tek': '#00d9ff',
        },
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        'display': ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      animation: {
        'glitch': 'glitch 0.3s ease-in-out infinite alternate',
        'flicker': 'flicker 3s linear infinite',
        'scan': 'scan 8s linear infinite',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        glitch: {
          '0%, 100%': { textShadow: '0.05em 0 0 #00ff9f, -0.05em -0.025em 0 #ff006e' },
          '50%': { textShadow: '-0.05em 0 0 #00ff9f, 0.05em -0.025em 0 #ff006e' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'pulse-neon': {
          '0%, 100%': { boxShadow: '0 0 5px #00ff9f, 0 0 10px #00ff9f' },
          '50%': { boxShadow: '0 0 20px #00ff9f, 0 0 30px #00ff9f' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
