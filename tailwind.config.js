/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          500: '#3b82f6',
          600: '#2563eb',
        },
        red: {
          500: '#ef4444',
        },
        yellow: {
          500: '#eab308',
        },
        gray: {
          200: '#e5e7eb',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
        },
      },
    },
  },
  plugins: [],
}; 