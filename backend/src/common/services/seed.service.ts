import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import { User } from '../../database/entities/user.entity';
import { Class } from '../../database/entities/class.entity';
import { Assignment } from '../../database/entities/assignment.entity';
import { Submission } from '../../database/entities/submission.entity';
import { Paper } from '../../database/entities/paper.entity';
import { Note } from '../../database/entities/note.entity';
import { Video } from '../../database/entities/video.entity';
import { Payment } from '../../database/entities/payment.entity';
import { Notification } from '../../database/entities/notification.entity';
import { Announcement } from '../../database/entities/announcement.entity';
import {
  Question,
  Quiz,
  QuizOption,
} from '../../database/entities/quiz.entity';
import { AcademicTerm, ExamResult } from '../../database/entities/result.entity';
import {
  AttendanceRecord,
  AttendanceSession,
} from '../../database/entities/attendance.entity';
import { PdfWatermarkService } from './pdf-watermark.service';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Class) private readonly classRepo: Repository<Class>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(Paper) private readonly paperRepo: Repository<Paper>,
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
    @InjectRepository(Video) private readonly videoRepo: Repository<Video>,
    @InjectRepository(Payment) private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Notification)
    private readonly notifRepo: Repository<Notification>,
    @InjectRepository(Announcement)
    private readonly annRepo: Repository<Announcement>,
    @InjectRepository(Quiz) private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(QuizOption)
    private readonly optionRepo: Repository<QuizOption>,
    @InjectRepository(AcademicTerm)
    private readonly termRepo: Repository<AcademicTerm>,
    @InjectRepository(ExamResult)
    private readonly resultRepo: Repository<ExamResult>,
    @InjectRepository(AttendanceSession)
    private readonly sessionRepo: Repository<AttendanceSession>,
    @InjectRepository(AttendanceRecord)
    private readonly recordRepo: Repository<AttendanceRecord>,
    private readonly watermarkService: PdfWatermarkService,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.DISABLE_AUTO_SEED === 'true') return;
    await this.seedIfEmpty();
  }

  async seedIfEmpty() {
    const count = await this.userRepo.count();
    if (count > 0) return;

    this.logger.log('Seeding Tuition LMS initial demo data...');
    const passwordHash = await bcrypt.hash('Demo@1234', 10);
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 86400000);
    const expiredGrace = new Date(now.getTime() - 2 * 86400000);

    const teacher = await this.userRepo.save(
      this.userRepo.create({
        id: 'user-teacher-1',
        email: 'teacher@mwtuition.lk',
        password: passwordHash,
        name: 'Maleesha Wijesinghe',
        role: 'teacher',
        grade: 'All',
        phone: '0771234567',
        institute: 'MW Tuition Institute',
        emailVerified: true,
        approvalStatus: 'approved',
        status: 'active',
        paymentStatus: 'paid',
        dashboardAccess: true,
      }),
    );

    const studentPaid = await this.userRepo.save(
      this.userRepo.create({
        id: 'user-student-1',
        email: 'student@mwtuition.lk',
        password: passwordHash,
        name: 'Kavindu Perera',
        role: 'student',
        grade: 'Grade 10',
        phone: '0719876543',
        tuitionClass: 'Grade 10 Mathematics & Science',
        emailVerified: true,
        approvalStatus: 'approved',
        status: 'active',
        paymentStatus: 'paid',
        paymentDueDate: in30Days,
        dashboardAccess: true,
      }),
    );

    const studentSecond = await this.userRepo.save(
      this.userRepo.create({
        id: 'user-student-2',
        email: 'nethmi@mwtuition.lk',
        password: passwordHash,
        name: 'Nethmi Silva',
        role: 'student',
        grade: 'Grade 10',
        phone: '0765554321',
        emailVerified: true,
        approvalStatus: 'approved',
        status: 'active',
        paymentStatus: 'paid',
        paymentDueDate: in30Days,
        dashboardAccess: true,
      }),
    );

    await this.userRepo.save(
      this.userRepo.create({
        id: 'user-student-overdue',
        email: 'overdue@mwtuition.lk',
        password: passwordHash,
        name: 'Kasun Bandara',
        role: 'student',
        grade: 'Grade 10',
        emailVerified: true,
        approvalStatus: 'approved',
        status: 'active',
        paymentStatus: 'unpaid',
        paymentDueDate: expiredGrace,
        dashboardAccess: true,
      }),
    );

    const mathClass = await this.classRepo.save(
      this.classRepo.create({
        id: 'class-g10-math',
        name: 'Grade 10 Mathematics — O/L Mastery',
        title: 'Grade 10 Mathematics — O/L Mastery',
        grade: 'Grade 10',
        subject: 'Mathematics',
        day: 'Saturday',
        time: '08:30 AM - 10:30 AM',
        fee: 2500,
        location: 'Hall A / Online Hybrid',
        description: 'Algebra, Geometry, Quadratic Equations and O/L Past Paper drills.',
        teacherId: teacher.id,
        students: [studentPaid, studentSecond],
      }),
    );

    const sciClass = await this.classRepo.save(
      this.classRepo.create({
        id: 'class-g10-sci',
        name: 'Grade 10 Science — Theory & Practicals',
        title: 'Grade 10 Science — Theory & Practicals',
        grade: 'Grade 10',
        subject: 'Science',
        day: 'Sunday',
        time: '02:00 PM - 04:00 PM',
        fee: 2500,
        location: 'Hall B',
        description: 'Physics motion, Chemical bonding and Biology cell structures.',
        teacherId: teacher.id,
        students: [studentPaid, studentSecond],
      }),
    );

    await this.annRepo.save([
      this.annRepo.create({
        id: 'ann-1',
        classId: mathClass.id,
        title: 'Term 2 Revision Quiz Open',
        content:
          'Complete the 10-minute Algebra Quick Check before Friday 8:00 PM (Asia/Colombo).',
        teacherId: teacher.id,
      }),
      this.annRepo.create({
        id: 'ann-2',
        classId: sciClass.id,
        title: 'Past Paper Discussion This Sunday',
        content: 'Bring or download the 2024 Western Province Science Paper from Study tab.',
        teacherId: teacher.id,
      }),
    ]);

    // Assignments
    const in4Days = new Date(now.getTime() + 4 * 86400000);
    const in10Days = new Date(now.getTime() + 10 * 86400000);
    const assign1 = await this.assignmentRepo.save(
      this.assignmentRepo.create({
        id: 'assign-1',
        classId: mathClass.id,
        title: 'Quadratic Equations Worksheet 03',
        description:
          'Solve all 6 factorization and discriminant questions cleanly and upload a PDF/photo or type your step-by-step answer.',
        dueDate: in4Days,
        maxMarks: 50,
        allowLateSubmission: true,
        createdById: teacher.id,
      }),
    );

    const assign2 = await this.assignmentRepo.save(
      this.assignmentRepo.create({
        id: 'assign-2',
        classId: sciClass.id,
        title: 'Newton’s Laws Lab Summary',
        description:
          'Write a brief explanation of Newton’s 2nd law with two everyday examples (F = ma calculations).',
        dueDate: in10Days,
        maxMarks: 40,
        allowLateSubmission: true,
        createdById: teacher.id,
      }),
    );

    await this.submissionRepo.save(
      this.submissionRepo.create({
        id: 'sub-1',
        assignmentId: assign2.id,
        studentId: studentPaid.id,
        answerText:
          'F = m * a. Pushing an empty shopping cart requires less force than a full cart for the same acceleration.',
        status: 'graded',
        isLate: false,
        marks: 36,
        remarks: 'Clear explanation and accurate unit notation.',
        gradedBy: teacher.id,
        gradedAt: now,
      }),
    );

    // Sample PDFs for Papers & Notes (with real generated valid PDF files for watermark testing)
    const uploadBase = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const paper1File = path.join(uploadBase, 'papers', 'sample_g10_maths_2025.pdf');
    const paper2File = path.join(uploadBase, 'papers', 'sample_g10_science_2024.pdf');
    const note1File = path.join(uploadBase, 'notes', 'sample_g10_algebra_notes.pdf');

    await this.watermarkService.createSamplePdfFile(
      paper1File,
      'Grade 10 Mathematics — Model Paper 2025',
      'Time Allowed: 2 Hours | Total Marks: 100',
      [
        'Part A — Short Answer Questions (40 Marks)',
        '1. Factorize completely: x^2 - 7x + 12',
        '2. Find the gradient of the line passing through (2, 3) and (6, 11).',
        '3. If 3x + 5 = 20, find the value of 2x - 1.',
        '4. Calculate the area of a triangle with base 12 cm and height 9 cm.',
        'Part B — Structured Essay Questions (60 Marks)',
        '5. Solve the simultaneous equations: 2x + y = 11 and x - y = 1.',
      ],
    );

    await this.watermarkService.createSamplePdfFile(
      paper2File,
      'Grade 10 Science — Western Province Term Paper',
      'Physics, Chemistry & Biology | 2024',
      [
        'Section 1 — Mechanics & Motion',
        '1. State Newton’s Second Law of Motion and write its SI unit equation.',
        '2. A car accelerates uniformly from 5 m/s to 25 m/s in 4 seconds. Find its acceleration.',
        'Section 2 — Chemical Bonding',
        '3. Draw the dot-and-cross diagram for Sodium Chloride (NaCl).',
      ],
    );

    await this.watermarkService.createSamplePdfFile(
      note1File,
      'Algebra & Quadratic Equations — Summary Notes',
      'MW Tuition Study Pack | Grade 10 Mathematics',
      [
        'Key Formulas:',
        '- Standard Quadratic Form: ax^2 + bx + c = 0 (a != 0)',
        '- Quadratic Formula: x = (-b +/- sqrt(b^2 - 4ac)) / 2a',
        '- Discriminant D = b^2 - 4ac:',
        '  * D > 0 : Two distinct real roots',
        '  * D = 0 : One repeated real root',
        '  * D < 0 : No real roots',
      ],
    );

    await this.paperRepo.save([
      this.paperRepo.create({
        id: 'paper-1',
        title: '2025 Mathematics Model Paper 01',
        grade: 'Grade 10',
        type: 'Model Paper',
        topic: 'Algebra & Geometry',
        year: '2025',
        classId: mathClass.id,
        fileUrl: '/uploads/papers/sample_g10_maths_2025.pdf',
        originalName: 'sample_g10_maths_2025.pdf',
        teacherId: teacher.id,
        downloads: 18,
      }),
      this.paperRepo.create({
        id: 'paper-2',
        title: '2024 Western Province Science Term Paper',
        grade: 'Grade 10',
        type: 'Past Paper',
        topic: 'Motion & Bonding',
        year: '2024',
        classId: sciClass.id,
        fileUrl: '/uploads/papers/sample_g10_science_2024.pdf',
        originalName: 'sample_g10_science_2024.pdf',
        teacherId: teacher.id,
        downloads: 12,
      }),
    ]);

    await this.noteRepo.save(
      this.noteRepo.create({
        id: 'note-1',
        title: 'Quadratic Equations & Discriminant Short Note',
        grade: 'Grade 10',
        topic: 'Algebra',
        classId: mathClass.id,
        fileUrl: '/uploads/notes/sample_g10_algebra_notes.pdf',
        originalName: 'sample_g10_algebra_notes.pdf',
        teacherId: teacher.id,
        downloads: 24,
      }),
    );

    await this.videoRepo.save([
      this.videoRepo.create({
        id: 'video-1',
        title: 'Quadratic Factorization — Step by Step Revision',
        description: 'Complete walkthrough of solving quadratic equations for O/L exam prep.',
        videoUrl: 'https://www.youtube.com/watch?v=IlNAJl36-10',
        grade: 'Grade 10',
        topic: 'Algebra',
        duration: '24 mins',
        classId: mathClass.id,
        teacherId: teacher.id,
      }),
      this.videoRepo.create({
        id: 'video-2',
        title: 'Newton’s Laws & Acceleration Numericals',
        description: 'Worked past-paper numerical examples on force, mass, and velocity-time graphs.',
        videoUrl: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
        grade: 'Grade 10',
        topic: 'Mechanics',
        duration: '19 mins',
        classId: sciClass.id,
        teacherId: teacher.id,
      }),
    ]);

    // Interactive MCQ Quizzes
    const quiz1 = await this.quizRepo.save(
      this.quizRepo.create({
        id: 'quiz-math-1',
        title: 'Algebra & Linear Graphs Timed Check',
        description: '5 multiple-choice questions. Server-enforced 10-minute timer.',
        classId: mathClass.id,
        grade: 'Grade 10',
        durationMinutes: 10,
        isPublished: true,
        shuffleQuestions: false,
        releaseAnswersAfterSubmit: true,
        maxAttempts: 2,
        createdById: teacher.id,
      }),
    );

    const quizQuestions = [
      {
        id: 'q1',
        prompt: 'What are the solutions to x² - 5x + 6 = 0?',
        explanation: '(x - 2)(x - 3) = 0, so x = 2 or x = 3.',
        marks: 2,
        options: [
          { label: 'x = 2 and x = 3', isCorrect: true },
          { label: 'x = -2 and x = -3', isCorrect: false },
          { label: 'x = 1 and x = 6', isCorrect: false },
          { label: 'x = -1 and x = 6', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        prompt: 'Find the gradient of the line y = 4x - 7.',
        explanation: 'In y = mx + c, m is the gradient, so m = 4.',
        marks: 2,
        options: [
          { label: '-7', isCorrect: false },
          { label: '4', isCorrect: true },
          { label: '7/4', isCorrect: false },
          { label: '-4', isCorrect: false },
        ],
      },
      {
        id: 'q3',
        prompt: 'If a triangle has angles 45° and 65°, what is the third angle?',
        explanation: 'Angles in a triangle add to 180°: 180 - (45 + 65) = 70°.',
        marks: 2,
        options: [
          { label: '80°', isCorrect: false },
          { label: '60°', isCorrect: false },
          { label: '70°', isCorrect: true },
          { label: '75°', isCorrect: false },
        ],
      },
      {
        id: 'q4',
        prompt: 'Simplify: 3(2a + 4) - 2a',
        explanation: '6a + 12 - 2a = 4a + 12.',
        marks: 2,
        options: [
          { label: '4a + 12', isCorrect: true },
          { label: '4a + 4', isCorrect: false },
          { label: '8a + 12', isCorrect: false },
          { label: '6a + 10', isCorrect: false },
        ],
      },
    ];

    for (let i = 0; i < quizQuestions.length; i++) {
      const q = quizQuestions[i];
      await this.questionRepo.save(
        this.questionRepo.create({
          id: q.id,
          quizId: quiz1.id,
          prompt: q.prompt,
          explanation: q.explanation,
          marks: q.marks,
          orderIndex: i,
        }),
      );
      for (let j = 0; j < q.options.length; j++) {
        await this.optionRepo.save(
          this.optionRepo.create({
            id: `${q.id}-opt-${j + 1}`,
            questionId: q.id,
            label: q.options[j].label,
            isCorrect: q.options[j].isCorrect,
            orderIndex: j,
          }),
        );
      }
    }

    // Academic Terms & Published Results
    const term1 = await this.termRepo.save(
      this.termRepo.create({
        id: 'term-2026-1',
        name: 'Term 1 Assessment',
        year: '2026',
        grade: 'Grade 10',
        isActive: true,
      }),
    );

    await this.termRepo.save(
      this.termRepo.create({
        id: 'term-2026-2',
        name: 'Term 2 Mid-Year Exam',
        year: '2026',
        grade: 'Grade 10',
        isActive: true,
      }),
    );

    await this.resultRepo.save([
      this.resultRepo.create({
        id: 'res-1',
        termId: term1.id,
        classId: mathClass.id,
        studentId: studentPaid.id,
        marks: 84,
        maxMarks: 100,
        status: 'graded',
        gradeLetter: 'A',
        remarks: 'Strong accuracy in algebra questions.',
        isPublished: true,
        updatedBy: teacher.id,
      }),
      this.resultRepo.create({
        id: 'res-2',
        termId: term1.id,
        classId: sciClass.id,
        studentId: studentPaid.id,
        marks: 72,
        maxMarks: 100,
        status: 'graded',
        gradeLetter: 'B',
        remarks: 'Revise balancing chemical equations for Term 2.',
        isPublished: true,
        updatedBy: teacher.id,
      }),
    ]);

    // Attendance Sessions (current month)
    const monthPrefix = now.toISOString().slice(0, 7);
    const sessionsData = [
      { id: 'att-s1', date: `${monthPrefix}-02`, topic: 'Linear Equations & Graphs', status: 'present' },
      { id: 'att-s2', date: `${monthPrefix}-05`, topic: 'Quadratic Factorization', status: 'present' },
      { id: 'att-s3', date: `${monthPrefix}-09`, topic: 'Geometry Theorems', status: 'late' },
      { id: 'att-s4', date: `${monthPrefix}-12`, topic: 'Revision Workshop', status: 'present' },
    ];
    for (const item of sessionsData) {
      await this.sessionRepo.save(
        this.sessionRepo.create({
          id: item.id,
          classId: mathClass.id,
          sessionDate: item.date,
          topic: item.topic,
          countExcusedInDenominator: true,
          createdById: teacher.id,
        }),
      );
      await this.recordRepo.save(
        this.recordRepo.create({
          id: `rec-${item.id}-s1`,
          sessionId: item.id,
          studentId: studentPaid.id,
          status: item.status,
          markedBy: teacher.id,
        }),
      );
      await this.recordRepo.save(
        this.recordRepo.create({
          id: `rec-${item.id}-s2`,
          sessionId: item.id,
          studentId: studentSecond.id,
          status: 'present',
          markedBy: teacher.id,
        }),
      );
    }

    // Payments & Notifications
    await this.paymentRepo.save(
      this.paymentRepo.create({
        id: 'pay-1',
        userId: studentPaid.id,
        classId: mathClass.id,
        amount: 2500,
        status: 'completed',
        method: 'bank_transfer',
        approvalStatus: 'approved',
        month: now.toLocaleString('en-US', { month: 'long' }),
        year: String(now.getFullYear()),
        reviewNotes: 'Confirmed bank deposit',
      }),
    );

    await this.notifRepo.save([
      this.notifRepo.create({
        id: 'notif-1',
        userId: studentPaid.id,
        title: 'New Quiz Published',
        message: 'Algebra & Linear Graphs Timed Check (10 mins) is open now.',
        type: 'quiz',
      }),
      this.notifRepo.create({
        id: 'notif-2',
        userId: studentPaid.id,
        title: 'Assignment Graded',
        message: 'Newton’s Laws Lab Summary graded: 36/40.',
        type: 'assignment',
      }),
    ]);

    this.logger.log(`Seed complete (Teacher: ${teacher.email}, Student: ${studentPaid.email})`);
  }
}

