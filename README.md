# MW Tuition LMS — Mobile-First PWA & Backend

This standalone `LMS/` workspace implements the **Tuition LMS Technical Development Blueprint** in a separate mobile-application-style experience without modifying `tutionproject_frontend` or `New folder/tutionproject_backendv2`.

## Structure
- `LMS/backend` — Standalone NestJS + TypeORM API (`http://localhost:5001`) with SQLite zero-config default (`lms_tuition.db`) and optional MySQL (`DB_TYPE=mysql`).
- `LMS/frontend` — Mobile-first React + Vite + Tailwind PWA (`http://localhost:5174`, `start_url=/lms/dashboard`, `scope=/lms/`).

## Quick Start (Local Testing)
### 1. Start LMS Backend (Port 5001)
```powershell
cd LMS\backend
npm install
npm run start
```
Swagger API Docs: `http://localhost:5001/api/docs`

### 2. Start LMS Mobile PWA Frontend (Port 5174)
```powershell
cd LMS\frontend
npm install
npm run dev
```
Open: `http://localhost:5174/lms/login`

## Demo Accounts (Password: `Demo@1234`)
- **Student (Approved & Paid):** `student@mwtuition.lk`
- **Student (14-Day Grace Expired / Payment Locked):** `overdue@mwtuition.lk`
- **Teacher / Admin Console:** `teacher@mwtuition.lk`

## Security & PWA Guarantees
- **No false screenshot-blocking claims:** `ExamActivityMonitor` honestly records tab/visibility switches without claiming a browser/PWA can block OS screenshots.
- **No answer keys leaked:** `GET /api/quizzes/:id` strips `isCorrect` and `explanation` for student roles until submitted and released.
- **Server-authoritative quiz timing & scoring:** Start, expiry, reconnect recovery, and duplicate submission prevention are enforced server-side inside transactions.
- **Strict PWA Shell Caching:** `public/lms/sw.js` caches only static app shell assets (`manifest.webmanifest`, `offline.html`, icons) and never caches `/api/*`, PDFs, marks, or receipts publicly. Logout dispatches `LOGOUT_CLEAR_CACHES`.

