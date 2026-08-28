import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      minHeight: {
        touch: "56px",
        "touch-lg": "64px",
      },
      minWidth: {
        touch: "56px",
        "touch-lg": "64px",
      },
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
        // Premium Indigo-Teal Palette
        indigo: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          950: "#1E1B4B",
        },
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          950: "#042F2E",
        },
        // Ayush Clinical Calm — preserved for functional compatibility
        ayush: {
          green: "#0F766E",
          emerald: "#0D9488",
          mint: "#F0FDFA",
          mintDark: "#CCFBF1",
          gold: "#D97706",
          goldLight: "#FEF3C7",
          sky: "#EFF6FF",
          skyDeep: "#1D4ED8",
          slate: "#1E293B",
          slateLight: "#F1F5F9",
        },
        // Clinical semantic colors
        clinic: {
          critical: "#DC2626",
          urgent: "#EA580C",
          routine: "#16A34A",
          info: "#2563EB",
        },
      },
      fontSize: {
        "2xs": ["0.65rem", { lineHeight: "1rem" }],
        "3xs": ["0.6rem", { lineHeight: "0.875rem" }],
        "touch-base": ["1.125rem", { lineHeight: "1.75rem" }],
        "touch-lg": ["1.25rem", { lineHeight: "1.875rem" }],
        "touch-xl": ["1.5rem", { lineHeight: "2rem" }],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        "clay": "0 4px 24px -4px rgba(67,56,202,0.14), inset 0 1px 2px rgba(255,255,255,0.9)",
        "clay-sm": "0 2px 12px -2px rgba(67,56,202,0.10), inset 0 1px 1px rgba(255,255,255,0.9)",
        "glass": "0 8px 40px -8px rgba(67,56,202,0.12), 0 2px 12px -2px rgba(0,0,0,0.04)",
        "glass-lg": "0 16px 60px -12px rgba(67,56,202,0.18), 0 4px 16px -4px rgba(0,0,0,0.06)",
        "indigo-glow": "0 0 0 4px rgba(67,56,202,0.15), 0 4px 20px -2px rgba(67,56,202,0.25)",
        "teal-glow": "0 0 0 4px rgba(13,148,136,0.15), 0 4px 20px -2px rgba(13,148,136,0.25)",
        "neo-alert": "5px 5px 0px 0px #DC2626",
        "premium": "0 2px 4px rgba(0,0,0,0.02), 0 8px 32px -4px rgba(67,56,202,0.08), 0 24px 64px -8px rgba(67,56,202,0.06)",
        "2xs": "0 1px 2px rgba(0,0,0,0.04)",
        "xs": "0 1px 4px rgba(0,0,0,0.06)",
      },
      backgroundImage: {
        "gradient-indigo": "linear-gradient(135deg, #4338CA 0%, #312E81 100%)",
        "gradient-teal": "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)",
        "gradient-ayush": "linear-gradient(135deg, #4338CA 0%, #0D9488 100%)",
        "gradient-glass": "linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(248,250,255,0.72) 100%)",
        "gradient-clay-white": "linear-gradient(145deg, #FFFFFF 0%, #F8FAFF 100%)",
        "gradient-clay-indigo": "linear-gradient(145deg, #EEF2FF 0%, #E0E7FF 100%)",
        "gradient-clay-teal": "linear-gradient(145deg, #F0FDFA 0%, #CCFBF1 100%)",
      },
      keyframes: {
        pulseMicro: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        floatUp: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(67,56,202,0.4)" },
          "70%": { boxShadow: "0 0 0 10px rgba(67,56,202,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(67,56,202,0)" },
        },
        tealPulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(13,148,136,0.4)" },
          "70%": { boxShadow: "0 0 0 12px rgba(13,148,136,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(13,148,136,0)" },
        },
      },
      animation: {
        "pulse-subtle": "pulseMicro 2s ease-in-out infinite",
        "ripple-glow": "ripple 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite",
        "shimmer": "shimmer 1.5s ease-in-out infinite",
        "float-up": "floatUp 3s ease-in-out infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "pulse-ring": "pulseRing 2s ease-out infinite",
        "teal-pulse-ring": "tealPulseRing 2s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
