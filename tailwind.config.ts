import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Renexx Brand Colors
        "renexx-navy": {
          DEFAULT: "hsl(215, 28%, 17%)", // Main dark navy
          light: "hsl(215, 28%, 25%)",
          dark: "hsl(215, 28%, 10%)",
        },
        "renexx-orange": {
          DEFAULT: "hsl(20, 90%, 50%)", // Main orange
          light: "hsl(20, 90%, 60%)",
          dark: "hsl(20, 90%, 40%)",
          50: "hsl(20, 90%, 95%)",
          100: "hsl(20, 90%, 90%)",
          200: "hsl(20, 90%, 80%)",
          300: "hsl(20, 90%, 70%)",
          400: "hsl(20, 90%, 60%)",
          500: "hsl(20, 90%, 50%)",
          600: "hsl(20, 90%, 40%)",
          700: "hsl(20, 90%, 30%)",
          800: "hsl(20, 90%, 20%)",
          900: "hsl(20, 90%, 10%)",
        },
        // Enhanced ERP colors with Renexx theme
        erp: {
          "50": "#f9fafb",
          "100": "#f3f4f6",
          "200": "#e5e7eb",
          "300": "#d1d5db",
          "400": "#9ca3af",
          "500": "#6b7280",
          "600": "#4b5563",
          "700": "#374151",
          "800": "#1f2937",
          "900": "#111827",
          "950": "#030712",
          accent: "hsl(20, 90%, 50%)", // Renexx orange
          "accent-light": "hsl(20, 90%, 60%)",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-100%)" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
        "scale-in": {
          from: { transform: "scale(0.95)", opacity: "0" },
          to: { transform: "scale(1)", opacity: "1" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px hsl(20, 90%, 50%)" },
          "50%": { boxShadow: "0 0 20px hsl(20, 90%, 50%), 0 0 30px hsl(20, 90%, 50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "slide-out": "slide-out 0.3s ease-out",
        spin: "spin 1.5s linear infinite",
        "scale-in": "scale-in 0.2s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "San Francisco", "Segoe UI", "Roboto", "Helvetica Neue", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        medium: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        card: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        elevated: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "renexx-glow": "0 0 20px hsla(20, 90%, 50%, 0.3)",
        "renexx-glow-strong": "0 0 30px hsla(20, 90%, 50%, 0.5)",
      },
      backgroundImage: {
        "renexx-gradient": "linear-gradient(135deg, hsl(215, 28%, 17%) 0%, hsl(215, 28%, 10%) 100%)",
        "renexx-orange-gradient": "linear-gradient(135deg, hsl(20, 90%, 50%) 0%, hsl(20, 90%, 40%) 100%)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
