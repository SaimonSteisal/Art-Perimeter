# PLAN.md: Akt Perimetr — Static Web App Refactoring

## Phase 1: Destructuring (Cleanup)
- [x] **1.1. Delete Backend Files:** Remove `server.js`, `db.json`, `logs.txt`, and the `uploads` directory.
- [x] **1.2. Clean up package.json:** Remove `express`, `cors`, `dotenv`, and `body-parser`. Leave only frontend dev dependencies (like Tailwind/Vite if applicable).
- [x] **1.3. Netlify Configuration:** Ensure Netlify publish directory is set to `.` (root).

## Phase 2: Frontend Math Engine
- [x] **2.1. Create Calculator Engine:** Create `src/js/calculator-engine.js`.
- [x] **2.2. Port Calculation Logic:** Extract and port all calculation logic (height, length, delivery, painting multipliers, and >100m discounts) from the old `server.js` to the new client-side engine.
- [x] **2.3. LocalStorage Integration:** Add functions to save/load calculator state from browser localStorage.
- [x] **2.4. Verification:** Test calculator calculations match old server-side logic.

## Phase 3: Form Integration
- [ ] **3.1. Update Contact Form:** Add `data-netlify="true"` attribute to `index.html` contact form.
- [ ] **3.2. Hidden Fields:** Write the `onSubmit` event listener to populate hidden fields with the final calculator output.
- [ ] **3.3. Form Validation:** Add client-side validation before submission.
- [ ] **3.4. Verification:** Test form submission to Netlify Forms dashboard.

## Phase 4: Styling & Design System
- [ ] **4.1. Tailwind Setup:** Configure Tailwind CSS with METALLUM design system.
- [ ] **4.2. Color Palette:** Set background #131319, accents #4edea3.
- [ ] **4.3. Component Styling:** Apply consistent styling to calculator, forms, and portfolio sections.
- [ ] **4.4. Verification:** Visual review on mobile and desktop.

## Phase 5: Content Migration
- [ ] **5.1. Static Content:** Migrate content from `db.json` to static HTML/JSON files.
- [ ] **5.2. Portfolio Items:** Convert portfolio data to static JSON or hardcoded HTML.
- [ ] **5.3. SEO Data:** Embed JSON-LD structured data directly in HTML.
- [ ] **5.4. Verification:** Check all content displays correctly.

## Phase 6: Final Testing & Deployment
- [ ] **6.1. End-to-End Testing:** Test full user journey (calculator → form submission).
- [ ] **6.2. Netlify Deployment:** Deploy to Netlify and verify forms are detected.
- [ ] **6.3. Performance Check:** Ensure page load times are acceptable.
- [ ] **6.4. Final Report:** Update QWEN.md with final architecture details.
