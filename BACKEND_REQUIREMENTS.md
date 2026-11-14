# LMS Backend Requirements & Contracts

## Environment Variables (`LMS/backend/.env.example`)
- `PORT` (default `5001`)
- `NODE_ENV` (`development` | `production`)
- `DB_TYPE` (`better-sqlite3` for instant local run, or `mysql` for MySQL production)
- `DB_SQLITE_PATH` (`./lms_tuition.db`)
- `DB_MIGRATIONS_RUN` (`true`)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (when `DB_TYPE=mysql`)
- `JWT_SECRET` (required >= 16 chars in production)
- `CORS_ORIGINS` (comma-separated allowed origins in production)
- `UPLOAD_DIR` (`./uploads`) and `MAX_UPLOAD_MB` (`10`)

## Implemented Endpoints (`/api/*`)
- **Auth:** `POST /api/auth/login`, `POST /api/auth/register`, `GET /api/auth/me`, `POST /api/auth/logout`, `POST /api/auth/change-password`
- **Classes:** `GET /api/classes`, `GET /api/classes/my-classes`, `GET /api/classes/:classId/roster`, `POST /api/classes`, `GET /api/classes/announcements/list`, `POST /api/classes/announcements`
- **Assignments & Submissions:**
  - `GET /api/assignments/my-assignments`
  - `GET /api/assignments/class/:classId`
  - `POST /api/assignments/:classId` (teacher)
  - `POST /api/assignments/:id/submissions` (multipart PDF/image + `answerText`)
  - `GET /api/assignments/:id/submissions` (teacher)
  - `PATCH /api/submissions/:id/grade` & `PUT /api/submissions/:id/grade` (teacher)
  - `GET /api/submissions/:id/file` (protected owner/teacher download)
- **MCQ Quizzes:**
  - `GET /api/quizzes`, `POST /api/quizzes`, `PATCH /api/quizzes/:id`, `GET /api/quizzes/:id`
  - `POST /api/quizzes/:id/attempts`, `PATCH /api/quiz-attempts/:id/answers`, `POST /api/quiz-attempts/:id/submit`
  - `GET /api/quiz-attempts/:id/result`, `GET /api/quizzes/:id/attempts`, `PATCH /api/quiz-attempts/:id/regrade`
- **Term Marks & Results:**
  - `GET /api/academic-terms`, `POST /api/academic-terms`
  - `POST /api/results`, `PATCH /api/results/publish`, `GET /api/results/class/:classId`, `GET /api/results/me`
- **Manual Attendance:**
  - `POST /api/attendance/sessions`, `GET /api/attendance/sessions/class/:classId`
  - `PUT /api/attendance/sessions/:id/records`, `GET /api/attendance/me?month=YYYY-MM`
- **Study Library & Fees:**
  - `GET/POST /api/papers`, `GET /api/papers/:id/download` (watermarked via `pdf-lib`), `DELETE /api/papers/:id`
  - `GET/POST /api/notes`, `GET /api/notes/:id/download` (watermarked via `pdf-lib`)
  - `GET/POST/DELETE /api/videos`
  - `GET /api/payments/my-payments`, `POST /api/payments/upload-receipt`, `GET /api/payments/receipts/all`, `GET /api/payments/:id/receipt`, `PUT /api/payments/:id/approve`, `PUT /api/payments/:id/reject`
  - `GET /api/notifications`, `PATCH /api/notifications/read-all`, `PATCH /api/notifications/:id/read`
  - `GET /api/students`, `PATCH /api/students/:id/approval`

