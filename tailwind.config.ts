import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    screens: { 'xs': '475px', 'sm': '640px', 'md': '768px', 'lg': '1024px', 'xl': '1280px', '2xl': '1536px' },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        headline: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))", foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))", "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))", "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))", ring: "hsl(var(--sidebar-ring))",
        },
        neo: {
          blue: "hsl(var(--neo-blue))", "blue-glow": "hsl(var(--neo-blue-glow))",
          dark: "hsl(var(--neo-dark))", "dark-lighter": "hsl(var(--neo-dark-lighter))",
          glass: "hsl(var(--neo-glass))", "glass-border": "hsl(var(--neo-glass-border))",
          "text-muted": "hsl(var(--neo-text-muted))", success: "hsl(var(--neo-success))",
          warning: "hsl(var(--neo-warning))", purple: "hsl(var(--neo-purple))", cyan: "hsl(var(--neo-cyan))",
        },
        "surface": {
          50: "hsl(240 3% 91%)", 100: "hsl(240 4% 73%)", 200: "hsl(240 6% 61%)",
          300: "hsl(240 6% 43%)", 400: "hsl(240 10% 31%)", 500: "hsl(240 20% 12%)",
          600: "hsl(240 20% 10%)", 700: "hsl(240 20% 8%)", 800: "hsl(240 20% 6%)",
          900: "hsl(240 20% 4%)",
        },
      },
      borderRadius: { lg: "var(--radius)", md: "calc(var(--radius) - 2px)", sm: "calc(var(--radius) - 4px)", "2xl": "1rem", "3xl": "1.5rem" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        pulse: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.5" } },
        "spin-slow": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        "fade-in-up": { from: { opacity: "0", transform: "translateY(20px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out", "accordion-up": "accordion-up 0.2s ease-out",
        "spin-slow": "spin-slow 3s linear infinite",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      backgroundImage: {
        "neo-gradient": "linear-gradient(145deg, hsl(260 100% 3%) 0%, hsl(240 20% 8%) 100%)",
        "neo-card-gradient": "linear-gradient(145deg, hsl(240 20% 8% / 0.95) 0%, hsl(260 100% 3% / 0.9) 100%)",
        "neo-blue-gradient": "linear-gradient(135deg, hsl(239 84% 67%) 0%, hsl(263 70% 58%) 100%)",
        "neo-warmth": "linear-gradient(135deg, hsl(239 84% 67%) 0%, hsl(263 70% 50%) 100%)",
        "neo-premium": "linear-gradient(135deg, hsl(239 84% 67%) 0%, hsl(263 70% 50%) 50%, hsl(239 84% 67%) 100%)",
        "neo-radial": "radial-gradient(ellipse at center, hsl(var(--primary) / 0.1) 0%, transparent 70%)",
      },
      boxShadow: {
        "neo-glow": "0 0 20px rgba(99, 102, 241, 0.3), 0 0 40px rgba(99, 102, 241, 0.15), 0 20px 40px rgba(0, 0, 0, 0.4)",
        "neo-glow-lg": "0 0 32px rgba(99, 102, 241, 0.4), 0 0 64px rgba(99, 102, 241, 0.2), 0 28px 56px rgba(0, 0, 0, 0.5)",
        "neo-card": "0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.04)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
