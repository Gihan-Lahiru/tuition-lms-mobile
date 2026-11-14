import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import * as fs from 'fs';
import * as path from 'path';
import { AppModule } from '../src/app.module';

describe('Tuition LMS Backend Integration & Security Suite', () => {
  let app: INestApplication;
  const testDbPath = path.join(__dirname, '..', 'test_lms_integration.db');
  let teacherToken = '';
  let student1Token = '';
  let student2Token = '';
  let overdueToken = '';

  beforeAll(async () => {
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    process.env.DB_TYPE = 'better-sqlite3';
    process.env.DB_SQLITE_PATH = testDbPath;
    process.env.DB_MIGRATIONS_RUN = 'true';
    process.env.DISABLE_AUTO_SEED = 'false';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const login = async (email: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'Demo@1234' });
      expect(res.status).toBe(201);
      return res.body.token as string;
    };

    teacherToken = await login('teacher@mwtuition.lk');
    student1Token = await login('student@mwtuition.lk');
    student2Token = await login('nethmi@mwtuition.lk');
    overdueToken = await login('overdue@mwtuition.lk');
  });

  afterAll(async () => {
    if (app) await app.close();
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch {
        // ignore cleanup race on windows
      }
    }
  });

  test('14-day payment grace lock blocks overdue student on content & quizzes but allows /api/payments/my-payments', async () => {
    const lockedRes = await request(app.getHttpServer())
      .get('/api/quizzes')
      .set('Authorization', `Bearer ${overdueToken}`);
    expect(lockedRes.status).toBe(403);

    const paymentStatusRes = await request(app.getHttpServer())
      .get('/api/payments/my-payments')
      .set('Authorization', `Bearer ${overdueToken}`);
    expect(paymentStatusRes.status).toBe(200);
    expect(paymentStatusRes.body.status.isLocked).toBe(true);
  });

  test('Quiz security: answer keys are stripped for students before submit and repeat submit is idempotent', async () => {
    const detailsRes = await request(app.getHttpServer())
      .get('/api/quizzes/quiz-math-1')
      .set('Authorization', `Bearer ${student1Token}`);
    expect(detailsRes.status).toBe(200);
    expect(detailsRes.body.questions.length).toBeGreaterThan(0);
    expect(detailsRes.body.questions[0].explanation).toBeUndefined();
    expect(detailsRes.body.questions[0].options[0].isCorrect).toBeUndefined();

    const startRes = await request(app.getHttpServer())
      .post('/api/quizzes/quiz-math-1/attempts')
      .set('Authorization', `Bearer ${student1Token}`);
    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.attempt.id;

    // Cross-student IDOR check: student2 cannot save or view student1's attempt
    const idorSave = await request(app.getHttpServer())
      .patch(`/api/quiz-attempts/${attemptId}/answers`)
      .set('Authorization', `Bearer ${student2Token}`)
      .send({
        answers: [{ questionId: 'q1', selectedOptionId: 'q1-opt-1' }],
      });
    expect(idorSave.status).toBe(403);

    // Save 2 correct answers out of 4
    const saveRes = await request(app.getHttpServer())
      .patch(`/api/quiz-attempts/${attemptId}/answers`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        answers: [
          { questionId: 'q1', selectedOptionId: 'q1-opt-1' }, // correct (2)
          { questionId: 'q2', selectedOptionId: 'q2-opt-2' }, // correct (2)
          { questionId: 'q3', selectedOptionId: 'q3-opt-1' }, // wrong (0)
        ],
      });
    expect(saveRes.status).toBe(200);

    const submit1 = await request(app.getHttpServer())
      .post(`/api/quiz-attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${student1Token}`);
    expect(submit1.status).toBe(201);
    expect(submit1.body.score).toBe(4);
    expect(submit1.body.maxScore).toBe(8);
    expect(submit1.body.percentage).toBe(50);

    // Repeat submission cannot duplicate scores
    const submit2 = await request(app.getHttpServer())
      .post(`/api/quiz-attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${student1Token}`);
    expect(submit2.status).toBe(201);
    expect(submit2.body.score).toBe(4);
    expect(submit2.body.percentage).toBe(50);
  });

  test('Assignment upload validates MIME type, submits text/file, and restricts grading to teacher role', async () => {
    const badFileRes = await request(app.getHttpServer())
      .post('/api/assignments/assign-1/submissions')
      .set('Authorization', `Bearer ${student1Token}`)
      .attach('file', Buffer.from('not allowed script'), {
        filename: 'evil.exe',
        contentType: 'application/x-msdownload',
      });
    expect(badFileRes.status).toBe(400);

    const submitText = await request(app.getHttpServer())
      .post('/api/assignments/assign-1/submissions')
      .set('Authorization', `Bearer ${student1Token}`)
      .field('answerText', 'x = 3 or x = 4 after factorizing (x-3)(x-4)=0.');
    expect(submitText.status).toBe(201);
    const subId = submitText.body.id;

    // Student cannot self-grade
    const studentGradeAttempt = await request(app.getHttpServer())
      .patch(`/api/submissions/${subId}/grade`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ marks: 50, remarks: 'Self grade' });
    expect(studentGradeAttempt.status).toBe(403);

    // Teacher grades submission
    const teacherGrade = await request(app.getHttpServer())
      .patch(`/api/submissions/${subId}/grade`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ marks: 46, remarks: 'Well structured steps' });
    expect(teacherGrade.status).toBe(200);
    expect(teacherGrade.body.marks).toBe(46);
    expect(teacherGrade.body.status).toBe('graded');
  });

  test('Term results enforce bounds 0..maxMarks, hide unpublished marks, and omit class rank', async () => {
    const invalidMark = await request(app.getHttpServer())
      .post('/api/results')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        termId: 'term-2026-2',
        classId: 'class-g10-math',
        results: [{ studentId: 'user-student-1', status: 'graded', marks: 110, maxMarks: 100 }],
      });
    expect(invalidMark.status).toBe(400);

    const saveUnpublished = await request(app.getHttpServer())
      .post('/api/results')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        termId: 'term-2026-2',
        classId: 'class-g10-math',
        results: [
          {
            studentId: 'user-student-1',
            status: 'graded',
            marks: 91,
            maxMarks: 100,
            isPublished: false,
          },
        ],
      });
    expect(saveUnpublished.status).toBe(201);

    const beforePublish = await request(app.getHttpServer())
      .get('/api/results/me')
      .set('Authorization', `Bearer ${student1Token}`);
    expect(beforePublish.status).toBe(200);
    expect(
      beforePublish.body.results.some((r: any) => r.termId === 'term-2026-2'),
    ).toBe(false);
    expect(beforePublish.body.summary.classRank).toBeUndefined();
  });

  test('Attendance prevents duplicate session on same date and rejects non-enrolled student', async () => {
    const create1 = await request(app.getHttpServer())
      .post('/api/attendance/sessions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ classId: 'class-g10-sci', sessionDate: '2026-11-15', topic: 'Optics' });
    expect(create1.status).toBe(201);

    const dup = await request(app.getHttpServer())
      .post('/api/attendance/sessions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ classId: 'class-g10-sci', sessionDate: '2026-11-15', topic: 'Optics' });
    expect(dup.status).toBe(409);

    const nonEnrolled = await request(app.getHttpServer())
      .put(`/api/attendance/sessions/${create1.body.id}/records`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        records: [{ studentId: 'user-student-overdue', status: 'present' }],
      });
    expect(nonEnrolled.status).toBe(400);
  });

  test('Watermarked paper download returns valid PDF bytes', async () => {
    const pdfRes = await request(app.getHttpServer())
      .get('/api/papers/paper-1/download')
      .set('Authorization', `Bearer ${student1Token}`);
    expect(pdfRes.status).toBe(200);
    expect(pdfRes.headers['content-type']).toContain('application/pdf');
    expect(pdfRes.body.slice(0, 4).toString()).toBe('%PDF');
  });

  test('Teacher creates single + multiple choice quiz, grades student answers, and updates answer key', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/api/quizzes')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        classId: 'class-g10-math',
        title: 'Multi-Select Prime Numbers Check',
        durationMinutes: 10,
        maxAttempts: 2,
        isPublished: true,
        releaseAnswersAfterSubmit: true,
        questions: [
          {
            prompt: 'Which of these are prime numbers?',
            questionType: 'multiple_choice',
            marks: 4,
            options: [
              { label: '2', isCorrect: true },
              { label: '3', isCorrect: true },
              { label: '4', isCorrect: false },
              { label: '9', isCorrect: false },
            ],
          },
          {
            prompt: 'What is 5 + 5?',
            questionType: 'single_choice',
            marks: 2,
            options: [
              { label: '9', isCorrect: false },
              { label: '10', isCorrect: true },
            ],
          },
        ],
      });
    expect(createRes.status).toBe(201);
    const quizId = createRes.body.id;

    // Student starts attempt
    const startRes = await request(app.getHttpServer())
      .post(`/api/quizzes/${quizId}/attempts`)
      .set('Authorization', `Bearer ${student1Token}`);
    expect(startRes.status).toBe(201);
    const attemptId = startRes.body.attempt.id;
    const [qMulti, qSingle] = startRes.body.questions;
    expect(qMulti.questionType).toBe('multiple_choice');
    expect(qSingle.questionType).toBe('single_choice');

    const opt2 = qMulti.options.find((o: any) => o.label === '2').id;
    const opt3 = qMulti.options.find((o: any) => o.label === '3').id;
    const opt4 = qMulti.options.find((o: any) => o.label === '4').id;
    const opt10 = qSingle.options.find((o: any) => o.label === '10').id;

    // Student picks exact [2, 3] for multiple_choice and [10] for single_choice -> full 6/6
    await request(app.getHttpServer())
      .patch(`/api/quiz-attempts/${attemptId}/answers`)
      .set('Authorization', `Bearer ${student1Token}`)
      .send({
        answers: [
          { questionId: qMulti.id, selectedOptionIds: [opt2, opt3] },
          { questionId: qSingle.id, selectedOptionIds: [opt10] },
        ],
      });

    const submit1 = await request(app.getHttpServer())
      .post(`/api/quiz-attempts/${attemptId}/submit`)
      .set('Authorization', `Bearer ${student1Token}`);
    expect(submit1.status).toBe(201);
    expect(submit1.body.score).toBe(6);
    expect(submit1.body.maxScore).toBe(6);

    // Teacher updates answer key on existing quiz so Q1 expects [2, 4] instead -> attempt re-scored to 2/6
    const keyRes = await request(app.getHttpServer())
      .patch(`/api/quizzes/${quizId}/answer-key`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        questions: [
          {
            questionId: qMulti.id,
            questionType: 'multiple_choice',
            correctOptionIds: [opt2, opt4],
          },
        ],
      });
    expect(keyRes.status).toBe(200);

    const updatedResult = await request(app.getHttpServer())
      .get(`/api/quiz-attempts/${attemptId}/result`)
      .set('Authorization', `Bearer ${student1Token}`);
    expect(updatedResult.status).toBe(200);
    expect(updatedResult.body.score).toBe(2);
  });

  test('Teacher can parse bulk text questions and generate quiz via AI agent', async () => {
    const rawTxt = `
1. What is the powerhouse of the cell?
A) Nucleus
*B) Mitochondria
C) Ribosome
D) Cell membrane
Explanation: Mitochondria generate most of the chemical energy needed by the cell.

2. Which of the following numbers are prime?
[x] 2
[x] 3
[ ] 4
[ ] 9

3. What is the capital of Sri Lanka?
A) Kandy
B) Galle
C) Sri Jayawardenepura Kotte
D) Jaffna
Answer: C
`;

    // Student is forbidden from parsing
    const studentDenied = await request(app.getHttpServer())
      .post('/api/quizzes/parse-text')
      .set('Authorization', `Bearer ${student1Token}`)
      .send({ text: rawTxt });
    expect(studentDenied.status).toBe(403);

    // Teacher parses raw text
    const parseRes = await request(app.getHttpServer())
      .post('/api/quizzes/parse-text')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ text: rawTxt });
    expect(parseRes.status).toBe(201);
    expect(parseRes.body.totalParsed).toBe(3);

    const [q1, q2, q3] = parseRes.body.questions;
    expect(q1.questionType).toBe('single_choice');
    expect(q1.options.find((o: any) => o.label === 'Mitochondria').isCorrect).toBe(true);
    expect(q1.explanation).toContain('Mitochondria generate most');

    expect(q2.questionType).toBe('multiple_choice');
    const q2Correct = q2.options.filter((o: any) => o.isCorrect).map((o: any) => o.label);
    expect(q2Correct).toEqual(expect.arrayContaining(['2', '3']));

    expect(q3.questionType).toBe('single_choice');
    expect(q3.options.find((o: any) => o.label === 'Sri Jayawardenepura Kotte').isCorrect).toBe(true);

    // Teacher generates quiz via AI from study notes text
    const aiRes = await request(app.getHttpServer())
      .post('/api/quizzes/generate-ai')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        text: 'Photosynthesis is defined as the process by which green plants transform light energy into chemical energy. Chlorophyll is responsible for absorbing sunlight. Water and carbon dioxide are necessary inputs.',
        questionCount: 2,
        questionType: 'single_choice',
      });
    expect(aiRes.status).toBe(201);
    expect(aiRes.body.totalParsed).toBeGreaterThanOrEqual(1);
    expect(aiRes.body.questions[0].options.length).toBeGreaterThanOrEqual(2);
    expect(aiRes.body.questions[0].options.some((o: any) => o.isCorrect)).toBe(true);
  });
});

