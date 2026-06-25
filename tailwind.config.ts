import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lumaq: {
          red: '#C8232B',
          'red-dark': '#9e1a21',
          'red-light': '#f5e8e9',
          black: '#1a1a1a',
          'gray-dark': '#3a3a3a',
          'gray-mid': '#6b6b6b',
          'gray-light': '#e8e8e8',
          'gray-bg': '#f5f5f5',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
