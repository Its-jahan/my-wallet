/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        xl: "1.5rem"
      }
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-vazirmatn)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-vazirmatn)", "ui-sans-serif", "system-ui"]
      },
      colors: {
        primary: {
          DEFAULT: "#2563eb",
          foreground: "#f8fafc"
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#475569"
        }
      },
      boxShadow: {
        card: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
