# PLAN.md: Art Perimeter — Static Web App (METALLUM Design)

## ✅ Phase 1: Legacy Purge (100% COMPLETE)
- [x] **1.1. Delete Backend Files:** Removed `server.js`, `db.json`, `logs.txt`, `test.js`, `metallum-estimator-widget.js`, and all backend scripts.
- [x] **1.2. Delete Old Public Folder:** Removed entire `/public` directory with old admin panels and handlers.
- [x] **1.3. Clean up package.json:** Only frontend dev dependencies remain (Vite, Tailwind, PostCSS, Autoprefixer).
- [x] **1.4. Remove Config Files:** Deleted `.env.example`, batch files, and demo files.

## ✅ Phase 2: Frontend Math Engine (100% COMPLETE)
- [x] **2.1. Calculator Engine:** `src/js/calculator-engine.js` contains all calculation logic.
- [x] **2.2. Calculation Logic:** Height multipliers, paint options, delivery fee, area-based discounts (>100m² = 5% off).
- [x] **2.3. LocalStorage Integration:** State persistence with 24-hour expiration.
- [x] **2.4. Form Helper Functions:** `populateFormFields()` for Netlify Forms integration.

## ✅ Phase 3: New UI Migration (100% COMPLETE)
- [x] **3.1. index.html Replacement:** Complete METALLUM theme implementation with Russian localization.
- [x] **3.2. Netlify Forms Integration:** Form has `data-netlify="true"`, name="quote-request", and hidden fields for total_price, order_details, and all calc values.
- [x] **3.3. Glue Code:** `src/js/app.js` connects sidebar inputs to calculator-engine.js.
- [x] **3.4. Localization:** All text in Russian (Арт Периметр, Оставить заявку, Калькулятор, etc.).

## ✅ Phase 4: METALLUM Design System (100% COMPLETE)
- [x] **4.1. CSS Stylesheet:** `src/css/styles.css` with METALLUM design tokens.
- [x] **4.2. Color Palette:** Background #131319, accent #4edea3 (green/teal).
- [x] **4.3. Components:** Hero section, calculator steps, result box, portfolio grid, footer.
- [x] **4.4. Responsive Design:** Mobile-friendly layouts included.

## ✅ Phase 5: Content & SEO (100% COMPLETE)
- [x] **5.1. Static Content:** All content hardcoded in index.html.
- [x] **5.2. Portfolio Section:** Static HTML portfolio items with placeholder images.
- [x] **5.3. JSON-LD Structured Data:** LocalBusiness schema embedded in head.
- [x] **5.4. Fence Types:** 5 types (3D Забор, Профнастил, Евроштакетник, Рабица, Кованый).
- [x] **5.5. Addons:** Gates, auto-gates, lighting, security systems.

## ✅ Phase 6: File Restructuring (100% COMPLETE)
- [x] **6.1. Root Directory:** Contains ONLY index.html, src/, assets/, package.json, PLAN.md, QWEN.md.
- [x] **6.2. Source Structure:** src/js/ (calculator-engine.js, app.js), src/css/ (styles.css).
- [x] **6.3. Assets Folder:** Created /assets for images (portfolio placeholders).

## 🚀 Ready for Netlify Deployment
- Publish directory: `/` (root)
- Forms detection: Automatic via `data-netlify="true"`
- No build step required (vanilla JS + CSS)
- Optional: `npm run build` if using Vite for CSS processing
