import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef0ff",
          100: "#e0e3ff",
          200: "#c7cbfe",
          300: "#a5aafc",
          400: "#8480f8",
          500: "#6b61f3",
          600: "#5547e8",
          700: "#4539cc",
          800: "#382fa8",
          900: "#2b2482",
        },
        accent: {
          50:  "#faf5ff",
          100: "#f3e8ff",
          200: "#e9d5ff",
          300: "#d8b4fe",
          400: "#c084fc",
          500: "#a855f7",
          600: "#9333ea",
          700: "#7e22ce",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
