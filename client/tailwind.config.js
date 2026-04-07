/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-background)',
        surface: 'var(--bg-surface)',
        'surface-hover': 'var(--bg-surface-hover)',
        'surface-raised': 'var(--bg-surface-raised)',
        border: 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        'border-focus': 'var(--border-focus)',
        primary: 'var(--text-primary)',
        muted: 'var(--text-muted)',
        inverse: 'var(--text-inverse)',
        
        accent: {
          DEFAULT: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          blue: 'var(--accent-blue)',
          red: 'var(--accent-red)',
          green: 'var(--accent-green)',
          orange: 'var(--accent-orange)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        sm: 'var(--shadow-small)',
        md: 'var(--shadow-medium)',
      },
    },
  },
  plugins: [],
}
