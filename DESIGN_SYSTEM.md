# 💎 Vantra Billing - Design System (v2.0 Performance)

> **Philosophy:** "Invisible Design". The interface recedes; the data stands out.
> **Performance:** 60FPS guaranteed. No heavy layout shifts. GPU-accelerated transitions.

## 1. Core Aesthetics (The "Vantra Feel")

### Backgrounds: We use a Layered Depth approach.
- **Layer 0 (App Background):** `bg-slate-50` (The canvas).
- **Layer 1 (Cards/Sidebar):** `bg-white` + `shadow-sm` (The objects).
- **Layer 2 (Dropdowns/Modals):** `bg-white` + `shadow-xl` (The floats).

### Borders
- They should be barely visible. Use `border-slate-200/60` (60% opacity) to blend better.

### Glassmorphism Lite
- Only use `backdrop-blur-md` and `bg-white/80` on **Sticky Headers** to keep scrolling smooth.

## 2. Typography Stack (Google Fonts)

Add this to `index.html`. We prioritize readability over style.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@500&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
```

| Scope | Font | Class | Notes |
|-------|------|-------|-------|
| **Titulares** | **Plus Jakarta Sans** | `font-heading` | Tight tracking (-0.02em). Bold but accessible. |
| **UI / Body** | **Inter** | `font-sans` | The standard. High legibility at small sizes (13px/14px). |
| **Finanzas** | **JetBrains Mono** | `font-mono` | Tabular figures. Vital for price alignment. |

## 3. Color System (Tailwind Tokens)

We avoid pure black. We use Slate (Blue-ish Gray) for a tech feel.

### Neutral Scale (Text & Borders)
- **Primary Text:** `text-slate-900` (High contrast).
- **Secondary Text:** `text-slate-500` (Metadata, labels).
- **Borders:** `border-slate-200`.

### Brand Colors (Indigo)
- **Primary:** `bg-indigo-600` (Main Actions).
- **Primary Light:** `bg-indigo-50` (Active states, highlights).
- **Primary Glow:** `shadow-indigo-500/20` (Colored shadows > Black shadows).

### Signal Colors (SaaS Statuses)
- 🟢 **Success (Pagado):** `text-emerald-700` / `bg-emerald-50` / `border-emerald-100`
- 🟠 **Warning (Pendiente):** `text-amber-700` / `bg-amber-50` / `border-amber-100`
- 🔴 **Error (Vencido):** `text-rose-700` / `bg-rose-50` / `border-rose-100`

## 4. Physics & Animation (The "Smoothness")

Don't just animate. Animate with intent.

- **Duration:** `duration-200` is the sweet spot.
- **Easing:** `ease-out` (starts fast, ends slow). Feels responsive.
- **Properties:** Only animate opacity, transform, and colors. **NEVER** animate width or height (CPU heavy).

## 5. Components Bible (Copy-Paste Ready)

### A. The "Vantra Card" (Dashboard Widget)
Note the group-hover interaction and the font mixing.

```jsx
<div className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 ease-out p-6 overflow-hidden">
  {/* Header */}
  <div className="flex justify-between items-start mb-4 relative z-10">
    <h3 className="font-heading text-sm font-semibold text-slate-500 uppercase tracking-wider">
      Ingresos Recurrentes
    </h3>
    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:scale-110 transition-transform duration-200">
       {/* Icon goes here */}
       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
    </div>
  </div>

  {/* Data */}
  <div className="relative z-10">
    <p className="font-mono text-3xl font-bold text-slate-900 tracking-tight">$45,231</p>
    <div className="flex items-center mt-1 gap-2">
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full text-xs font-bold flex items-center">
        +12.5%
      </span>
      <span className="font-sans text-xs text-slate-400">vs mes anterior</span>
    </div>
  </div>

  {/* Background Decoration (Subtle Gradient) */}
  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
</div>
```

### B. The "Action Button" (Primary)
Includes focus rings for accessibility and active state for tactile feel.

```jsx
<button className="
  relative inline-flex items-center justify-center gap-2
  bg-slate-900 hover:bg-slate-800 text-white
  font-heading font-medium text-sm
  h-10 px-6 rounded-xl
  shadow-lg shadow-slate-900/20 hover:shadow-slate-900/30
  transform active:scale-95 transition-all duration-200 ease-out
  focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2
">
  <span>Generar Factura</span>
  {/* Arrow Icon */}
  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
</button>
```

### C. The Status Badge
Clean, bordered, and using the specific color tokens.

```jsx
// Variant: Success
<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/50">
  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
  Pagado
</span>
```

## 6. Tailwind Configuration (Optimized)
Replace your `tailwind.config.js` with this. It includes the custom fonts and the "diffuse shadows".

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["'Plus Jakarta Sans'", "sans-serif"],
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        // Custom refined gray scale if needed, otherwise default slate is great
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        'xl': '0.75rem',    // 12px (Buttons)
        '2xl': '1rem',      // 16px (Cards)
        '3xl': '1.5rem',    // 24px (Layout Containers)
      },
      boxShadow: {
        // The "Vantra" Diffuse Shadows (Blue-tinted grays)
        'sm': '0 1px 2px 0 rgba(15, 23, 42, 0.06)',
        'md': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)',
        'lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(15, 23, 42, 0.04)',
        'xl': '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 10px 10px -5px rgba(15, 23, 42, 0.03)',
        // Glows
        'glow-primary': '0 0 20px rgba(79, 70, 229, 0.15)',
      }
    },
  },
  plugins: [],
}
```
