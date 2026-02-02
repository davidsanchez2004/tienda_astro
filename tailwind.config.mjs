/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        arena: '#D4C5B9',
        'arena-light': '#E8DCCF',
        'arena-pale': '#F5F1ED',
        'sand': '#E4D5C8',
        'cream': '#FAF7F2',
        'gold': '#D4A574',
        'gold-soft': '#E8C99C',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'linen': 'url(\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23F5F1ED%22 width=%22100%22 height=%22100%22/%3E%3Cpath d=%22M0 0h100v100H0%22 fill=%22none%22 stroke=%22%23E8DCCF%22 stroke-width=%220.5%22 opacity=%220.1%22/%3E%3C/svg%3E\')',
      },
    },
  },
  plugins: [],
}
