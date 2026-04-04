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
 * [x] **2.7. Git:** Commit "Logic: Expanded calculator formulas".

## Phase 3: Admin API & Security (The "Shield")
 * [x] **3.1. Token Expiry:** (Simulation) Add a timestamp to ADMIN_TOKEN validation logic.
 * [x] **3.2. Lead Management:** Create DELETE /api/leads/:id endpoint to allow admins to clear old requests.
 * [x] **3.3. Portfolio Editor:** Create POST /api/portfolio endpoint to add new items via Admin Panel.
 * [x] **3.4. Input Sanitization:** Add a helper to strip HTML tags from all incoming POST data (protection against XSS).
 * [x] **3.5. Security Tests:** Add tests for unauthorized access attempts in test.js.
 * [x] **3.6. Verification:** Run node test.js.
 * [x] **3.7. Git:** Commit "Security: Admin API and Sanitization".

## Phase 4: Frontend Integration & Optimization (The "Face")
 * [x] **4.1. Asset Audit:** Check all image paths in db.json and ensure they exist in the project folder.
 * [x] **4.2. JSON-LD Implementation:** Add a function to generate SEO structured data (Organization, LocalBusiness) into the HTML output.
 * [x] **4.3. Dynamic Gallery:** Refactor the portfolio section to load items directly from api/data instead of hardcoded HTML.
 * [x] **4.4. Mobile Form:** Ensure the "Lead Form" has inputmode and type attributes optimized for mobile (tel, text).
 * [x] **4.5. Verification:** Run node test.js (Check if API still serves correct data for frontend).
 * [x] **4.6. Git:** Commit "UX: Dynamic content and SEO".

## Phase 5: Final Polish & Stress Test
 * [x] **5.1. Log System:** Create a logs.txt file where the server records every lead and every error.
 * [x] **5.2. Error Pages:** Add a catch-all middleware in Express for 404 and 500 errors.
 * [x] **5.3. Performance Check:** Measure API response time in test.js (must be < 50ms).
 * [x] **5.4. Final Report:** Generate a summary of the whole project state.
 * [x] **5.5. Git:** Final Commit "Release: v1.0 Production Ready".

## Phase 6: Advanced Features & Business Logic
 * [x] **6.1. Lead Status Tracking:** Add status field (new, in_progress, completed, rejected) to leads with PATCH /api/leads/:id/status endpoint.
 * [x] **6.2. Lead Export:** Create GET /api/leads/export?format=csv endpoint to download leads as CSV.
 * [x] **6.3. Rate Limiting:** Implement simple IP-based rate limiting on POST /api/leads to prevent spam (max 5 per minute per IP).
 * [x] **6.4. Content Versioning:** Add version history to content changes (who changed what, when) via POST /api/save with diff tracking.
 * [x] **6.5. Test Expansion:** Add tests for lead status, CSV export, rate limiting, and content versioning.
 * [x] **6.6. Verification:** Run node test.js.
 * [ ] **6.7. Git:** Commit "Features: Lead management, export, rate limiting".

## Phase 7: Site Structure Restored & Admin Integrated
 * [x] **7.1. Routing Fix:** Added explicit routes for `/`, `/admin`, and `/admin/plan` in server.js.
 * [x] **7.2. Landing Page:** Root URL now serves public/index.html (Full business site with Hero, Services, Portfolio, Calculator, Contact).
 * [x] **7.3. Admin Dashboard:** `/admin` route serves admin panel with login protection.
 * [x] **7.4. Plan Viewer:** Created `/admin/plan` route that dynamically reads and renders PLAN.md.
 * [x] **7.5. Plan Integration:** Admin Panel now has access to Development AI-Dashboard via dedicated view.
 * [x] **7.6. Data Flow:** All website content pulled from db.json via API.
 * [x] **7.7. Verification:** Run node test.js — all 96 tests pass.
 * [ ] **7.8. Git:** Commit "Structure: Routing restored, Admin integrated, PLAN.md viewer".

## Phase 8: Admin Dashboard Enhancement (Formerly Phase 7)
 * [ ] **8.1. Admin Stats:** Create GET /api/stats endpoint returning leads count by status, total revenue from calculator, avg response time.
 * [ ] **8.2. Bulk Lead Operations:** Add POST /api/leads/bulk-delete and POST /api/leads/bulk-status endpoints.
 * [ ] **8.3. Content Preview:** Create GET /api/preview endpoint that returns rendered HTML preview of content changes without saving.
 * [ ] **8.4. File Upload Support:** Add POST /api/upload endpoint for uploading images (stored in /uploads) with size validation.
 * [ ] **8.5. Test Expansion:** Add tests for stats, bulk operations, preview, and file upload.
 * [ ] **8.6. Verification:** Run node test.js.
 * [ ] **8.7. Git:** Commit "Admin: Stats, bulk ops, file uploads".

## Phase 9: Production Hardening (Formerly Phase 8)
 * [ ] **9.1. Environment Config:** Move ADMIN_PASSWORD, TOKEN_SECRET, PORT to .env file with dotenv-like native parsing.
 * [ ] **9.2. Graceful Shutdown:** Handle SIGTERM/SIGINT to close server connections and flush logs before exit.
 * [ ] **9.3. Health Check:** Create GET /api/health endpoint returning uptime, memory usage, db status, and log file size.
 * [ ] **9.4. Log Rotation:** Implement log rotation — when logs.txt exceeds 1MB, archive to logs_YYYY-MM-DD.txt and start fresh.
 * [ ] **9.5. Test Expansion:** Add tests for health check, graceful shutdown simulation, and log rotation.
 * [ ] **9.6. Verification:** Run node test.js.
 * [ ] **9.7. Git:** Commit "Production: Health check, graceful shutdown, log rotation".

## Phase 10: Final Release v2.0 (Formerly Phase 9)
 * [ ] **10.1. Comprehensive Test Suite:** Ensure 100+ tests pass with 0 failures.
 * [ ] **10.2. Code Cleanup:** Remove unused code, add JSDoc comments to all exported functions.
 * [ ] **10.3. Final Verification:** Run node test.js — all pass.
 * [ ] **10.4. Git:** Final Commit "Release: v2.0 Full Production".
