import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        // font-sans → Inter (Latin) + 霞鹜文楷 Screen (中文) + Noto Sans SC (fallback)
        sans: ["var(--font-sans)", "LXGW WenKai Screen", "var(--font-zh)", "system-ui", "sans-serif"],
        // font-mono → JetBrains Mono
        mono: ["var(--font-mono)", "ui-monospace", "Menlo", "monospace"]
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite"
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: "0 0" },
          to: { backgroundPosition: "-200% 0" }
        }
      },
      colors: {
        bg: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        text: "rgb(var(--color-text) / <alpha-value>)",
        primary: "rgb(var(--color-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-secondary) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        border: "rgb(var(--color-border) / <alpha-value>)"
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)"
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        card: "var(--shadow-card)"
      },
      spacing: {
        1: "var(--space-1)",
        2: "var(--space-2)",
        3: "var(--space-3)",
        4: "var(--space-4)",
        6: "var(--space-6)",
        8: "var(--space-8)",
        12: "var(--space-12)",
        16: "var(--space-16)"
      },
      fontSize: {
        body: ["var(--font-body-size)", { lineHeight: "var(--font-body-line)" }],
        h1: ["var(--font-h1-size)", { lineHeight: "var(--font-h1-line)" }],
        h2: ["var(--font-h2-size)", { lineHeight: "var(--font-h2-line)" }],
        h3: ["var(--font-h3-size)", { lineHeight: "var(--font-h3-line)" }]
      }
    }
  },
  plugins: [typography, forms]
};

export default config;
