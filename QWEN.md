# QWEN.md — Art Perimeter (Akt Perimetr)

## Project Overview

**Art Perimeter** (Арт Периметр / Akt Perimetr) is a static web application for a metal fence and structure installation company based in Moscow, Russia. 

### Architecture Shift (Current Refactoring)

We are migrating from a Node.js backend with local file storage to a **purely Static Web App** hosted on **Netlify**, utilizing **Netlify Forms** for lead generation.

## Core Directives (STRICT RULES)

### 1. Architecture
- **Type:** Static Web App
- **Hosting:** Netlify
- **Data Processing:** Netlify Forms (No custom backend)
- **No Server-Side Code:** All form handling is done via Netlify Forms integration

### 2. Code Constraints
- **STRICTLY NO Node.js code** in the source directory
- All JavaScript must be **client-side** (browser-compatible vanilla JS)
- No `require()`, no `module.exports`, no Express.js patterns
- Use ES6+ features that work in modern browsers

### 3. State Management
- `db.json` is **DEPRECATED** - do not use for runtime data
- Use browser `localStorage` for saving intermediate user data or calculator states
- Form submissions go directly to Netlify Forms

### 4. Styling
- **Strictly Tailwind CSS**
- **Design System: "METALLUM"**
  - Dark theme background: `#131319`
  - Primary accent color: `#4edea3` (green/teal)
  - Industrial, modern aesthetic

### 5. Form Handling
- Any dynamically calculated data (like total price) **MUST** be injected into `<input type="hidden">` fields via JavaScript before submission
- This ensures Netlify Forms can capture calculated values
- Add `data-netlify="true"` attribute to all forms that should be processed

## Business Features

- **Fence cost calculator** — 3-step wizard with fence type selection, length/addons, and result with lead capture form
- **Lead management** — Handled via Netlify Forms dashboard with email notifications
- **Portfolio gallery** — Static content loaded from JSON or hardcoded HTML
- **SEO** — JSON-LD structured data (LocalBusiness schema) embedded in HTML

## Directory Structure (New Architecture)

```
Art-Perimeter/
├── index.html             # Main entry point (root)
├── package.json           # Frontend dev dependencies only (Tailwind, Vite if used)
├── PLAN.md                # Development roadmap
├── QWEN.md                # This file - project directives
├── src/
│   ├── js/
│   │   └── calculator-engine.js  # Client-side calculation logic
│   └── css/
│       └── styles.css     # Tailwind CSS output
├── public/
│   ├── index.html         # Main SPA shell
│   ├── app.js             # Frontend application (IIFE pattern, browser-compatible)
│   ├── style.css          # Global styles (Tailwind)
│   ├── admin.html         # Admin panel (if needed, simplified)
│   └── admin.js           # Admin logic (browser-compatible)
├── netlify.toml           # Netlify configuration
└── .github/workflows/     # CI/CD (if applicable)
```

## Building and Running

### Local Development

```bash
# Install dependencies
npm install

# Start development server (Vite or similar)
npm run dev

# Build for production
npm run build
```

### Deployment

- **Publish Directory:** `.` (root) or `dist/` if using a build step
- **Forms Detection:** Netlify automatically detects forms with `data-netlify="true"`
- **Environment Variables:** Configure in Netlify dashboard if needed

## Calculator Logic (Client-Side)

Formula: `total = length × fencePrice × heightMultiplier × paintMultiplier + addons + delivery - discount`

- **Discount:** 5% off when area > 100m²
- **Height multipliers:** 
  - 1.5m (×1.0)
  - 1.8m (×1.15)
  - 2.0m (×1.25)
  - 2.5m (×1.5)
- **Paint options:** 
  - none (×1.0)
  - ground-эмаль (×1.1)
  - powder (×1.2)
- **Delivery:** flat fee 5000₽

## Key Constants

| Constant | Value |
|---|---|
| Default Height Multiplier | 1.0 (for 1.5m) |
| Default Paint Multiplier | 1.0 (no paint) |
| Delivery Fee | 5000₽ |
| Discount Threshold | 100m² |
| Discount Percent | 5% |

## Migration Notes (From Old Architecture)

### Removed Components
- ❌ `server.js` - Express server (replaced by Netlify)
- ❌ `db.json` - File-based database (replaced by Netlify Forms + localStorage)
- ❌ `logs.txt` - Server logs (not needed for static apps)
- ❌ `uploads/` directory - File uploads (handled by Netlify Forms if needed)
- ❌ Admin authentication system (simplified or removed)
- ❌ Rate limiting (handled by Netlify)
- ❌ Content versioning API (simplified approach)

### Preserved Components
- ✅ Calculator logic (ported to client-side JS)
- ✅ Frontend UI components
- ✅ Lead generation (via Netlify Forms)
- ✅ Portfolio display
- ✅ Contact forms
