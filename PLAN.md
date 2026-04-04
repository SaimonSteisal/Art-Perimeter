# PLAN.md: Art-Perimeter Full-Cycle Development

## Phase 1: Core Architecture & Data Integrity (Hardening)
 * [x] **1.1. Schema Validation:** Update server.js to include a strict validation function for db.json structure.
 * [x] **1.2. Backup System:** Implement a backupDb() function that creates db.json.bak before any write operation.
 * [x] **1.3. Atomic Writes:** Refactor writeDb to use a temporary file then rename it (preventing data loss on crash).
 * [x] **1.4. Test Expansion:** Add unit tests in test.js for the new backup and validation logic.
 * [x] **1.5. Verification:** Run node test.js and ensure all DB-related tests pass.
 * [x] **1.6. Git:** Commit "Infrastructure: Secure DB handling".

## Phase 2: Advanced Calculator Logic (The "Math" Engine)
 * [x] **2.1. Height Parameter:** Add height (высота забора) to the calculation logic in server.js.
 * [x] **2.2. Delivery Logic:** Add a flat fee or distance-based calculation for delivery.
 * [x] **2.3. Painting Options:** Add a multiplier for different types of coating (ground, powder, etc.).
 * [x] **2.4. Discount System:** Implement a logic that applies a 5% discount if the total area > 100m.
 * [x] **2.5. Test Edge Cases:** Add tests for 0 length, negative values, and huge orders in test.js.
 * [x] **2.6. Verification:** Run node test.js.
 * [ ] **2.7. Git:** Commit "Logic: Expanded calculator formulas".

## Phase 3: Admin API & Security (The "Shield")
 * [ ] **3.1. Token Expiry:** (Simulation) Add a timestamp to ADMIN_TOKEN validation logic.
 * [ ] **3.2. Lead Management:** Create DELETE /api/leads/:id endpoint to allow admins to clear old requests.
 * [ ] **3.3. Portfolio Editor:** Create POST /api/portfolio endpoint to add new items via Admin Panel.
 * [ ] **3.4. Input Sanitization:** Add a helper to strip HTML tags from all incoming POST data (protection against XSS).
 * [ ] **3.5. Security Tests:** Add tests for unauthorized access attempts in test.js.
 * [ ] **3.6. Verification:** Run node test.js.
 * [ ] **3.7. Git:** Commit "Security: Admin API and Sanitization".

## Phase 4: Frontend Integration & Optimization (The "Face")
 * [ ] **4.1. Asset Audit:** Check all image paths in db.json and ensure they exist in the project folder.
 * [ ] **4.2. JSON-LD Implementation:** Add a function to generate SEO structured data (Organization, LocalBusiness) into the HTML output.
 * [ ] **4.3. Dynamic Gallery:** Refactor the portfolio section to load items directly from api/data instead of hardcoded HTML.
 * [ ] **4.4. Mobile Form:** Ensure the "Lead Form" has inputmode and type attributes optimized for mobile (tel, text).
 * [ ] **4.5. Verification:** Run node test.js (Check if API still serves correct data for frontend).
 * [ ] **4.6. Git:** Commit "UX: Dynamic content and SEO".

## Phase 5: Final Polish & Stress Test
 * [ ] **5.1. Log System:** Create a logs.txt file where the server records every lead and every error.
 * [ ] **5.2. Error Pages:** Add a catch-all middleware in Express for 404 and 500 errors.
 * [ ] **5.3. Performance Check:** Measure API response time in test.js (must be < 50ms).
 * [ ] **5.4. Final Report:** Generate a summary of the whole project state.
 * [ ] **5.5. Git:** Final Commit "Release: v1.0 Production Ready".
