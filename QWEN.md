# QWEN.md — Art Perimeter

## Project Overview

**Art Perimeter** (Арт Периметр) is a business website for a metal fence and structure installation company based in Moscow, Russia. It is a full-stack Node.js application with:

- **Backend:** Express.js server (`server.js`) with file-based JSON storage (`db.json`), REST API, admin authentication, lead management (CRM), content versioning, rate limiting, and calculator logic.
- **Frontend:** Vanilla JS SPA (`public/app.js`) that dynamically renders sections (Hero, Features, Calculator, Services, Portfolio, Contacts) from API data. Dark-themed industrial design with green primary color (#2e7d32).
- **Admin Panel:** Client-side admin dashboard (`public/admin.html` + `public/admin.js`) with login-protected content editing, lead viewing, and token-based auth.
- **Testing:** 96 unit/integration tests in `test.js` using Node's native `node:test` and `assert` modules.

### Key Business Features

- **Fence cost calculator** — 3-step wizard with fence type selection, length/addons, and result with lead capture form
- **Lead management** — CRM with status tracking (new, in_progress, completed, rejected), CSV export, rate limiting (5/min/IP)
- **Content management** — Editable site content via admin panel with version history and rollback
- **Portfolio gallery** — Dynamic portfolio loaded from database
- **SEO** — JSON-LD structured data (LocalBusiness schema)

## Directory Structure

```
Art-Perimeter/
├── server.js              # Express server, API routes, DB logic
├── test.js                # 96 integration/unit tests
├── package.json           # Dependencies
├── PLAN.md                # Development roadmap (11 phases)
├── db.json                # Live database (content + leads)
├── db.json.bak            # Automatic backup
├── logs.txt               # Server activity log
├── index.html             # Root redirect
├── demo.html              # Widget demo page
├── metallum-estimator-widget.js  # Standalone calculator widget
├── public/
│   ├── index.html         # Main SPA shell
│   ├── app.js             # Frontend application (IIFE pattern)
│   ├── style.css          # Global styles
│   ├── admin.html         # Admin panel
│   ├── admin.js           # Admin logic (IIFE pattern)
│   └── admin-plan.html    # PLAN.md viewer for admin
├── uploads/               # Uploaded files
├── .github/workflows/     # CI/CD
└── node_modules/
```

## Building and Running

### Start the server

```bash
npm start
# or
npm run dev
# or
node server.js
```

Server runs on **http://localhost:3000**

| Route | Description |
|---|---|
| `/` | Public landing page |
| `/admin` | Admin dashboard (password: `admin123`) |
| `/admin/plan` | Development plan viewer |

### API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/data` | — | Get site content |
| GET | `/api/jsonld` | — | SEO structured data |
| GET | `/api/leads` | — | Get all leads |
| POST | `/api/leads` | — | Create lead (rate limited) |
| PATCH | `/api/leads/:id/status` | Token | Update lead status |
| DELETE | `/api/leads/:id` | Token | Delete lead |
| GET | `/api/leads/export?format=csv` | Token | Export leads as CSV |
| POST | `/api/login` | — | Admin login, returns token |
| POST | `/api/save` | Token | Save content changes |
| POST | `/api/portfolio` | Token | Add portfolio item |
| POST | `/api/calculate` | — | Calculate fence cost |
| GET | `/api/content/history` | Token | Content version history |
| POST | `/api/content/rollback` | Token | Rollback to previous version |
| GET | `/api/assets/audit` | — | Audit image assets |

### Running tests

```bash
node test.js
```

Tests run on port 3999, reset DB to defaults, and verify all API endpoints. Currently **96 tests, 0 failures**.

## Development Conventions

### Architecture Patterns

- **IIFE (Immediately Invoked Function Expression)** for frontend modules — `App` and `Admin` are singleton modules returning public APIs
- **File-based JSON DB** with atomic writes (write to `.tmp`, then `renameSync`) and automatic backups (`.bak`)
- **Token-based admin auth** — JSON token with secret + timestamp, validated on each protected endpoint
- **Input sanitization** — HTML tag stripping + entity encoding on all incoming POST data

### Coding Style

- Vanilla JS (ES6+), no build step, no framework dependencies for frontend
- `'use strict'` mode in all modules
- CSS custom properties (variables) for theming
- Mobile-first responsive design with CSS Grid and Flexbox
- IntersectionObserver for scroll animations (`.fade-in` class)

### Database Schema (`db.json`)

```json
{
  "content": {
    "site_title": "string",
    "company_name": "string",
    "phone_main": "string",
    "hero_title": "string",
    "hero_bg": "string (URL)",
    "calc_fences": ["array of fence types with prices"],
    "calc_extras": ["array of addons"],
    "services": ["array of service cards"],
    "portfolio": ["array of portfolio items"],
    "advantages": ["array of feature cards"],
    // ... many more string fields
  },
  "leads": [
    {
      "id": "string (timestamp)",
      "timestamp": "number",
      "date": "string (localized)",
      "status": "new|in_progress|completed|rejected",
      "name": "string",
      "phone": "string",
      "type": "calc|contact",
      "details": "object (calculator snapshot)"
    }
  ],
  "contentHistory": [
    {
      "timestamp": "number",
      "date": "string",
      "changes": ["array of changed keys"],
      "snapshot": "object (full previous content)"
    }
  ]
}
```

### Calculator Logic

Formula: `total = length × fencePrice × heightMultiplier × paintMultiplier + addons + delivery - discount`

- Discount: 5% off when area > 100m²
- Height multipliers: 1.5m (×1.0), 1.8m (×1.15), 2.0m (×1.25), 2.5m (×1.5)
- Paint options: none (×1.0), ground-эмаль (×1.1), powder (×1.2)
- Delivery: flat fee 5000₽

### Security

- Schema validation on every DB write
- Atomic writes (temp file + rename)
- Automatic backup before each write
- Input sanitization (strip HTML tags, encode entities)
- Rate limiting on lead submission (5/minute per IP)
- Token expiration (24 hours)
- Directory traversal protection on file serving

## Key Constants

| Constant | Value |
|---|---|
| PORT | 3000 |
| ADMIN_PASSWORD | `admin123` |
| Rate limit | 5 requests/min per IP on POST /api/leads |
| Token expiry | 24 hours |
| Content history | Last 20 versions |
| Test port | 3999 |
