# LMS Implementation Status

All 8 Sprints of the LKR 50,000 MVP defined in `Tuition_LMS_Technical_Development_Blueprint.docx` are implemented cleanly inside the isolated `LMS/` directory, leaving `tutionproject_frontend` and `New folder/tutionproject_backendv2` completely unmodified.

| Sprint | Scope | Status |
|---|---|---|
| Sprint 1 | Architecture, protected `/lms/*` shell, JWT session, shared API client | Completed |
| Sprint 2 | Mobile bottom tabs, drawer menu, `manifest.webmanifest`, Service Worker, iOS/Android install prompt, offline fallback | Completed |
| Sprint 3 | Assignments list, typed + PDF/image upload, late flagging (`Asia/Colombo`), teacher grading & completion metrics | Completed |
| Sprint 4 | Interactive MCQ quizzes, server deadline timer, reconnect resume, idempotent answer autosave & submit, teacher quiz builder | Completed |
| Sprint 5 | Academic terms, teacher mark entry (`0..maxMarks`, absent/not_graded), published-only student report view (no class rank) | Completed |
| Sprint 6 | Manual attendance sessions, duplicate session/record prevention, edit audit log, monthly % with explicit denominator | Completed |
| Sprint 7 | Watermarked Past Papers & Notes PDFs (`pdf-lib`), video lessons, 14-day fee grace guard, receipt upload & review, notifications | Completed |
| Sprint 8 | Unit + API security/IDOR integration tests, migration, docs & UAT checklist | Completed |

## Documented Post-MVP Backlog (Out of Agreed MVP Scope)
- Parent portal accounts
- Native iOS / Android app-store wrappers (Capacitor / React Native)
- Automated SMS / WhatsApp payment reminders
- Class-wide leaderboard / class rank analytics

