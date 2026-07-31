import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#FF6B00",
        "primary-hover": "#FF914D", // Using the lighter gradient end for hover
        accent: "#FF914D",
        "bg-main": "#FFF8F2",
        "bg-alt": "#FFFFFF",
        "text-primary": "#161616",
        "text-muted": "#5E6472",
        success: "#22C55E",
        offer: "#FFE4CF",
        "border-subtle": "#F2F2F2",
      },
      boxShadow: {
        'native': '0 4px 20px rgba(0, 0, 0, 0.05)',
        'native-lg': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'float': '0 -4px 24px rgba(0, 0, 0, 0.06)',
        'premium': '0 10px 40px rgba(0, 0, 0, 0.08)',
        'premium-sm': '0 4px 12px rgba(0, 0, 0, 0.04)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
