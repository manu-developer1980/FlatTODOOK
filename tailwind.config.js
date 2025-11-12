/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2E8B57", // Verde mar
          dark: "#236B43",
          light: "#3CB371",
        },
        secondary: {
          DEFAULT: "#FF6B35", // Naranja cálido
          dark: "#E55A2B",
          light: "#FF8C5A",
        },
        success: "#28A745",
        warning: "#FFC107",
        danger: "#DC3545",
        info: "#17A2B8",
      },
      fontSize: {
        // Accesibilidad: tamaños mínimos para personas mayores
        'xs': ['0.875rem', { lineHeight: '1.25rem' }], // 14px mínimo
        'sm': ['1rem', { lineHeight: '1.5rem' }],      // 16px mínimo
        'base': ['1.125rem', { lineHeight: '1.75rem' }], // 18px mínimo
        'lg': ['1.25rem', { lineHeight: '1.75rem' }],
        'xl': ['1.5rem', { lineHeight: '2rem' }],
        '2xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '4xl': ['3rem', { lineHeight: '1.16' }],
        '5xl': ['4rem', { lineHeight: '1.12' }],
        '6xl': ['5rem', { lineHeight: '1.1' }],
      },
      spacing: {
        // Botones más grandes para accesibilidad
        '18': '4.5rem', // 72px para botones principales
        '22': '5.5rem', // 88px para botones de confirmación
      },
      minHeight: {
        // Alturas mínimas para elementos interactivos (WCAG 2.1)
        '11': '2.75rem', // 44px mínimo para áreas de click
        '14': '3.5rem',  // 56px para botones principales
        '18': '4.5rem',  // 72px para botones de confirmación
      },
      minWidth: {
        '11': '2.75rem', // 44px mínimo para áreas de click
        '14': '3.5rem',   // 56px para botones principales
        '18': '4.5rem',   // 72px para botones de confirmación
      },
      borderRadius: {
        // Bordes más redondeados para accesibilidad
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
