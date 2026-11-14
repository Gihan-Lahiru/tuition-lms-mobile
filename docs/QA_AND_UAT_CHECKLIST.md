# QA Report & Client UAT Checklist

## Automated Test Coverage
- **Backend Unit & API Integration (`LMS/backend/npm test`):**
  - Grade normalization, percentage clamping, Sri Lankan A/B/C/S/F band mapping, attendance numerator/denominator formula (`grade.util.spec.ts`).
  - 14-day payment grace lock enforcement (`DashboardAccessGuard`) & fee portal bypass (`test/lms-api.spec.ts`).
  - Quiz security: answer keys hidden from students, cross-student IDOR blocked (`403`), server-authoritative grading, anti-duplicate submission score integrity.
  - Assignment upload MIME validation (`400` on `.exe`), student self-grading blocked (`403`), teacher grading bounds & feedback persistence.
  - Term results bounds validation (`0..maxMarks`), unpublished mark privacy, omission of class rank.
  - Attendance duplicate session prevention (`409`) and roster membership check (`400`).
  - Watermarked PDF download (`%PDF` byte verification).
- **Frontend Unit Tests (`LMS/frontend/npm test`):**
  - Percentage calculation, grade badge mapping, attendance denominator formula, `MM:SS` countdown formatting.

## Client UAT Sign-Off Checklist
- [ ] Open `/lms/login` on mobile screen (`<= 430px`) or desktop phone-frame toggle and sign in as Student (`student@mwtuition.lk`).
- [ ] Verify Bottom Tab Navigation (`Home`, `Study`, `Quizzes`, `Work`, `More`) and `More` bottom drawer sheet.
- [ ] Preview & download watermarked Past Paper PDF under `Study -> Papers`.
- [ ] Take timed MCQ Quiz under `Quizzes`, refresh browser mid-attempt to verify reconnect resume + server countdown, then submit & inspect results.
- [ ] Submit assignment answer/file under `Work`.
- [ ] Sign in as Teacher (`teacher@mwtuition.lk`), create/publish a quiz, grade a submission, enter & publish Term 2 marks, mark class attendance, and approve a payment receipt.
- [ ] Sign in as Overdue Student (`overdue@mwtuition.lk`) to confirm content/quizzes lock while `Fees & Slips` receipt upload stays accessible.
- [ ] Test Chrome Android & iOS Safari PWA install button / Add to Home Screen instructions.

