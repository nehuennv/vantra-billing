/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                // Poppins para Títulos, Botones y Navs (PERSONALIDAD FUERTE)
                heading: ["'Plus Jakarta Sans'", "sans-serif"],

                // Inter para textos largos y párrafos (LEGIBILIDAD)
                sans: ["'Plus Jakarta Sans'", "sans-serif"],

                // JetBrains para la plata y las tablas (PRECISIÓN)
                mono: ["'Plus Jakarta Sans'", "sans-serif"],
            },
            colors: {
                border: "hsl(var(--border) / <alpha-value>)",
                input: "hsl(var(--input) / <alpha-value>)",
                ring: "hsl(var(--ring) / <alpha-value>)",
                background: "hsl(var(--background) / <alpha-value>)",
                foreground: "hsl(var(--foreground) / <alpha-value>)",
                primary: {
                    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
                    foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
                    foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
                    foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted) / <alpha-value>)",
                    foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent) / <alpha-value>)",
                    foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover) / <alpha-value>)",
                    foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
                },
                card: {
                    DEFAULT: "hsl(var(--card) / <alpha-value>)",
                    foreground: "hsl(var(--card-foreground) / <alpha-value>)",
                },
            },
            borderRadius: {
                'xl': '0.75rem',    // 12px (Buttons)
                '2xl': '1rem',      // 16px (Cards)
                '3xl': '1.5rem',    // 24px (Layout Containers)
            },
            boxShadow: {
                // The "Vantra" Diffuse Shadows
                'sm': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
                'DEFAULT': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
                'md': '0 6px 12px -2px rgba(15, 23, 42, 0.08), 0 3px 6px -3px rgba(15, 23, 42, 0.04)',
                'lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04)',
                'xl': '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.03)',
                // Colored Shadows (Glows)
                'glow-primary': '0 0 20px -5px hsl(var(--primary) / 0.3)',
                'glow-sm': '0 0 10px -3px hsl(var(--primary) / 0.2)',
            }
        },
    },
    plugins: [],
}