# QWEN.md — Art Perimeter (METALLUM Static Site)

## Project Overview

**Art Perimeter** (Арт Периметр) is a **purely static web application** for a metal fence and structure installation company based in Moscow, Russia. The project uses the **METALLUM design system** with a dark industrial theme.

### Architecture: STATIC ONLY

This project is now **100% static**. There is NO backend code, NO server-side processing, and NO Node.js runtime dependencies.

## ⚠️ CRITICAL DIRECTIVES (STRICT RULES)

### 1. Architecture - STATIC ONLY
- **Type:** Pure Static Web App (HTML/CSS/JS)
- **Hosting:** Netlify (or any static host)
- **Data Processing:** Netlify Forms (zero custom backend)
- **NO Server-Side Code:** All JavaScript runs in the browser

### 2. Code Constraints - ZERO BACKEND
- ❌ **NEVER** add `require()`, `module.exports`, or CommonJS syntax
- ❌ **NEVER** add Express.js, Fastify, or any server framework
- ❌ **NEVER** add `server.js`, `api/`, or backend routes
- ❌ **NEVER** use `fs`, `path`, `http`, or Node.js built-in modules
- ✅ **ONLY** browser-compatible vanilla JavaScript (ES6+)
- ✅ **ONLY** client-side APIs (localStorage, fetch, DOM)

### 3. File Structure - CLEAN ROOT
```
/workspace
├── index.html              # Main entry point (REQUIRED in root)
├── package.json            # Frontend dev deps ONLY (Vite, Tailwind)
├── PLAN.md                 # Development roadmap
├── QWEN.md                 # This file - project directives
├── src/
│   ├── js/
│   │   ├── calculator-engine.js  # Client-side calculation logic
│   │   └── app.js                # UI glue code
│   └── css/
│       └── styles.css            # METALLUM design styles
└── assets/
    └── *.jpg, *.png              # Images (portfolio, logo)
```

**Root directory must contain ONLY:**
- `index.html`
- `package.json`
- `PLAN.md`
- `QWEN.md`
- `src/` folder
- `assets/` folder

### 4. Styling - METALLUM Design System
- **CSS Framework:** Custom CSS with CSS variables (or Tailwind if needed)
- **Background:** `#131319` (dark gray/black)
- **Primary Accent:** `#4edea3` (green/teal)
- **Secondary Background:** `#1a1a24`
- **Text Primary:** `#ffffff`
- **Text Secondary:** `#a0a0b0`
- **Aesthetic:** Industrial, modern, kinetic steel

### 5. Form Handling - Netlify Forms
All forms MUST have:
```html
<form 
  name="form-name" 
  method="POST" 
  data-netlify="true"
  netlify-honeypot="bot-field"
>
  <input type="hidden" name="form-name" value="form-name">
  <input type="hidden" name="total_price" id="total_price">
  <input type="hidden" name="order_details" id="order_details">
  <!-- other fields -->
</form>
```

**Hidden Fields Rule:** All dynamically calculated values (total price, breakdown) MUST be injected into hidden `<input>` fields via JavaScript before form submission.

## Business Features

| Feature | Implementation |
|---------|---------------|
| Fence Calculator | 3-step wizard (type → params → addons) |
| Cost Calculation | Client-side in `calculator-engine.js` |
| Lead Capture | Netlify Forms with email notifications |
| Portfolio Gallery | Static HTML with placeholder images |
| SEO | JSON-LD LocalBusiness schema in `<head>` |
| Localization | Russian language (ru-RU) |

## Calculator Logic (Client-Side)

**Formula:** `total = length × fencePrice × heightMultiplier × paintMultiplier + addons + delivery - discount`

### Constants (in `calculator-engine.js`)

| Constant | Value | Description |
|----------|-------|-------------|
| `DELIVERY_FEE` | 5000 ₽ | Flat delivery fee |
| `DISCOUNT_THRESHOLD` | 100 m² | Area threshold for discount |
| `DISCOUNT_PERCENT` | 5% | Discount when area > 100m² |

### Height Multipliers

| Height | Multiplier |
|--------|------------|
| 1.5 м | ×1.0 |
| 1.8 м | ×1.15 |
| 2.0 м | ×1.25 |
| 2.5 м | ×1.5 |

### Paint Options

| Option | ID | Multiplier |
|--------|-----|------------|
| Без покраски | `none` | ×1.0 |
| Грунт-эмаль | `ground` | ×1.1 |
| Порошковая покраска | `powder` | ×1.2 |

### Fence Types

| Type | ID | Base Price (₽/м) |
|------|-----|------------------|
| 3D Забор | `3d-fence` | 1800 |
| Профнастил | `profile` | 2200 |
| Евроштакетник | `lattice` | 2000 |
| Рабица | `chain-link` | 1200 |
| Кованый | `wrought` | 4500 |

### Addons

| Addon | ID | Price (₽) |
|-------|-----|-----------|
| Калитка | `gate` | 15000 |
| Автоматические ворота | `auto-gate` | 45000 |
| Освещение | `lighting` | 8000 |
| Система безопасности | `security` | 25000 |

## State Management

- **Calculator State:** Saved to `localStorage` with key `artPerimeterCalculatorState`
- **Expiration:** State auto-expires after 24 hours
- **Form Data:** Submitted directly to Netlify Forms (not stored locally)

## Building and Running

### Local Development

```bash
# Install dependencies (frontend tools only)
npm install

# Start development server (if using Vite)
npm run dev

# Build for production (optional - vanilla JS works without build)
npm run build
```

### Deployment to Netlify

1. **Connect Repository:** Link GitHub/GitLab repo to Netlify
2. **Build Settings:**
   - **Publish directory:** `/` (root)
   - **Build command:** (optional) `npm run build`
   - **Functions directory:** (leave empty - no functions needed)
3. **Forms Detection:** Automatic via `data-netlify="true"` attribute
4. **Environment Variables:** None required (static site)

## Testing Checklist

Before deployment, verify:

- [ ] Calculator produces correct totals
- [ ] Discount applies when area > 100m²
- [ ] Hidden form fields populate on calculation
- [ ] Form submits to Netlify Forms dashboard
- [ ] All text is in Russian
- [ ] Mobile responsive design works
- [ ] No console errors in browser
- [ ] No backend/Node.js code present

## Migration Notes (Legacy → Static)

### Removed (Never Return)
- ❌ `server.js` - Express server
- ❌ `db.json` - File database
- ❌ `logs.txt` - Server logs
- ❌ `uploads/` - File upload directory
- ❌ `/public` - Old public folder with admin panels
- ❌ `test.js` - Backend test scripts
- ❌ `.env.example` - Environment config
- ❌ Batch files (`*.bat`) - Windows scripts

### Preserved & Ported
- ✅ Calculator logic → `src/js/calculator-engine.js`
- ✅ UI components → `index.html` + `src/css/styles.css`
- ✅ Lead generation → Netlify Forms
- ✅ Portfolio display → Static HTML
- ✅ Contact forms → Netlify Forms

## Support & Maintenance

This is a **static website**. Maintenance involves:
1. Updating content in `index.html`
2. Modifying styles in `src/css/styles.css`
3. Adjusting calculator logic in `src/js/calculator-engine.js`
4. Adding portfolio images to `assets/`

**No server maintenance, no database backups, no API deployments.**
