import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitLmsSchema1731400000000 implements MigrationInterface {
  name = 'InitLmsSchema1731400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const dt = queryRunner.connection.options.type === 'mysql' ? 'datetime' : 'datetime';

    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'email', type: 'varchar', length: '191', isUnique: true },
          { name: 'password', type: 'text' },
          { name: 'name', type: 'varchar', length: '191' },
          { name: 'role', type: 'varchar', length: '32', default: "'student'" },
          { name: 'profilePicture', type: 'text', isNullable: true },
          { name: 'tuitionClass', type: 'varchar', length: '128', isNullable: true },
          { name: 'grade', type: 'varchar', length: '64', isNullable: true },
          { name: 'phone', type: 'varchar', length: '64', isNullable: true },
          { name: 'institute', type: 'varchar', length: '191', isNullable: true },
          { name: 'emailVerified', type: 'boolean', default: true },
          { name: 'approvalStatus', type: 'varchar', length: '32', default: "'pending'" },
          { name: 'status', type: 'varchar', length: '32', default: "'active'" },
          { name: 'paymentStatus', type: 'varchar', length: '32', default: "'unpaid'" },
          { name: 'paymentDueDate', type: dt, isNullable: true },
          { name: 'dashboardAccess', type: 'boolean', default: true },
          { name: 'currentSessionId', type: 'varchar', length: '128', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'classes',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'name', type: 'varchar', length: '191' },
          { name: 'title', type: 'varchar', length: '191', isNullable: true },
          { name: 'grade', type: 'varchar', length: '64' },
          { name: 'subject', type: 'varchar', length: '128' },
          { name: 'day', type: 'varchar', length: '64', isNullable: true },
          { name: 'time', type: 'varchar', length: '64', isNullable: true },
          { name: 'fee', type: 'integer', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'location', type: 'varchar', length: '191', isNullable: true },
          { name: 'teacherId', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'class_students',
        columns: [
          { name: 'classesId', type: 'varchar', length: '64', isPrimary: true },
          { name: 'usersId', type: 'varchar', length: '64', isPrimary: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'assignments',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'classId', type: 'varchar', length: '64' },
          { name: 'title', type: 'varchar', length: '191' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'dueDate', type: dt, isNullable: true },
          { name: 'maxMarks', type: 'integer', default: 100 },
          { name: 'allowLateSubmission', type: 'boolean', default: true },
          { name: 'attachmentUrl', type: 'text', isNullable: true },
          { name: 'createdById', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'submissions',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'assignmentId', type: 'varchar', length: '64' },
          { name: 'studentId', type: 'varchar', length: '64' },
          { name: 'answerText', type: 'text', isNullable: true },
          { name: 'fileUrl', type: 'text', isNullable: true },
          { name: 'originalFileName', type: 'varchar', length: '255', isNullable: true },
          { name: 'mimeType', type: 'varchar', length: '128', isNullable: true },
          { name: 'status', type: 'varchar', length: '32', default: "'submitted'" },
          { name: 'isLate', type: 'boolean', default: false },
          { name: 'remarks', type: 'text', isNullable: true },
          { name: 'marks', type: 'integer', isNullable: true },
          { name: 'gradedBy', type: 'varchar', length: '64', isNullable: true },
          { name: 'gradedAt', type: dt, isNullable: true },
          { name: 'submittedAt', type: dt, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'submissions',
      new TableIndex({
        name: 'IDX_submissions_assignment_student',
        columnNames: ['assignmentId', 'studentId'],
        isUnique: true,
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'papers',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'title', type: 'varchar', length: '191' },
          { name: 'grade', type: 'varchar', length: '64' },
          { name: 'type', type: 'varchar', length: '64', default: "'Paper'" },
          { name: 'topic', type: 'varchar', length: '191', isNullable: true },
          { name: 'year', type: 'varchar', length: '16', isNullable: true },
          { name: 'classId', type: 'varchar', length: '64', isNullable: true },
          { name: 'fileUrl', type: 'text' },
          { name: 'originalName', type: 'varchar', length: '255', isNullable: true },
          { name: 'teacherId', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
          { name: 'downloads', type: 'integer', default: 0 },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notes',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'title', type: 'varchar', length: '191' },
          { name: 'grade', type: 'varchar', length: '64' },
          { name: 'topic', type: 'varchar', length: '191', isNullable: true },
          { name: 'classId', type: 'varchar', length: '64', isNullable: true },
          { name: 'fileUrl', type: 'text' },
          { name: 'originalName', type: 'varchar', length: '255', isNullable: true },
          { name: 'teacherId', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
          { name: 'downloads', type: 'integer', default: 0 },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'videos',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'title', type: 'varchar', length: '191' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'videoUrl', type: 'text' },
          { name: 'grade', type: 'varchar', length: '64' },
          { name: 'topic', type: 'varchar', length: '191', isNullable: true },
          { name: 'duration', type: 'varchar', length: '32', isNullable: true },
          { name: 'classId', type: 'varchar', length: '64', isNullable: true },
          { name: 'teacherId', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'payments',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'userId', type: 'varchar', length: '64' },
          { name: 'classId', type: 'varchar', length: '64', isNullable: true },
          { name: 'amount', type: 'real' },
          { name: 'status', type: 'varchar', length: '32', default: "'pending'" },
          { name: 'method', type: 'varchar', length: '64', isNullable: true },
          { name: 'receiptUrl', type: 'text', isNullable: true },
          { name: 'approvalStatus', type: 'varchar', length: '32', default: "'pending'" },
          { name: 'reviewNotes', type: 'text', isNullable: true },
          { name: 'month', type: 'varchar', length: '32', isNullable: true },
          { name: 'year', type: 'varchar', length: '16', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'notifications',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'userId', type: 'varchar', length: '64' },
          { name: 'title', type: 'varchar', length: '191' },
          { name: 'message', type: 'text' },
          { name: 'type', type: 'varchar', length: '32', default: "'info'" },
          { name: 'isRead', type: 'boolean', default: false },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'announcements',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'classId', type: 'varchar', length: '64' },
          { name: 'title', type: 'varchar', length: '191' },
          { name: 'content', type: 'text' },
          { name: 'teacherId', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    // New Quiz Tables
    await queryRunner.createTable(
      new Table({
        name: 'quizzes',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'title', type: 'varchar', length: '191' },
          { name: 'description', type: 'text', isNullable: true },
          { name: 'classId', type: 'varchar', length: '64' },
          { name: 'grade', type: 'varchar', length: '64' },
          { name: 'durationMinutes', type: 'integer', default: 15 },
          { name: 'opensAt', type: dt, isNullable: true },
          { name: 'closesAt', type: dt, isNullable: true },
          { name: 'isPublished', type: 'boolean', default: false },
          { name: 'shuffleQuestions', type: 'boolean', default: false },
          { name: 'releaseAnswersAfterSubmit', type: 'boolean', default: true },
          { name: 'maxAttempts', type: 'integer', default: 1 },
          { name: 'createdById', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'questions',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'quizId', type: 'varchar', length: '64' },
          { name: 'prompt', type: 'text' },
          { name: 'explanation', type: 'text', isNullable: true },
          { name: 'marks', type: 'integer', default: 1 },
          { name: 'orderIndex', type: 'integer', default: 0 },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'quiz_options',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'questionId', type: 'varchar', length: '64' },
          { name: 'label', type: 'text' },
          { name: 'isCorrect', type: 'boolean', default: false },
          { name: 'orderIndex', type: 'integer', default: 0 },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'quiz_attempts',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'quizId', type: 'varchar', length: '64' },
          { name: 'studentId', type: 'varchar', length: '64' },
          { name: 'status', type: 'varchar', length: '32', default: "'in_progress'" },
          { name: 'randomSeed', type: 'integer', isNullable: true },
          { name: 'startedAt', type: dt },
          { name: 'expiresAt', type: dt },
          { name: 'submittedAt', type: dt, isNullable: true },
          { name: 'score', type: 'integer', default: 0 },
          { name: 'maxScore', type: 'integer', default: 0 },
          { name: 'percentage', type: 'real', default: 0 },
          { name: 'tabSwitchCount', type: 'integer', default: 0 },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'quiz_answers',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'attemptId', type: 'varchar', length: '64' },
          { name: 'questionId', type: 'varchar', length: '64' },
          { name: 'selectedOptionId', type: 'varchar', length: '64', isNullable: true },
          { name: 'isCorrect', type: 'boolean', isNullable: true },
          { name: 'awardedMarks', type: 'integer', default: 0 },
          { name: 'savedAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'quiz_answers',
      new TableIndex({
        name: 'IDX_quiz_answers_attempt_question',
        columnNames: ['attemptId', 'questionId'],
        isUnique: true,
      }),
    );

    // Academic Terms & Exam Results
    await queryRunner.createTable(
      new Table({
        name: 'academic_terms',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'name', type: 'varchar', length: '191' },
          { name: 'year', type: 'varchar', length: '16' },
          { name: 'grade', type: 'varchar', length: '64', isNullable: true },
          { name: 'isActive', type: 'boolean', default: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'exam_results',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'termId', type: 'varchar', length: '64' },
          { name: 'classId', type: 'varchar', length: '64' },
          { name: 'studentId', type: 'varchar', length: '64' },
          { name: 'marks', type: 'real', isNullable: true },
          { name: 'maxMarks', type: 'real', default: 100 },
          { name: 'status', type: 'varchar', length: '32', default: "'not_graded'" },
          { name: 'gradeLetter', type: 'varchar', length: '8', isNullable: true },
          { name: 'remarks', type: 'text', isNullable: true },
          { name: 'isPublished', type: 'boolean', default: false },
          { name: 'updatedBy', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'exam_results',
      new TableIndex({
        name: 'IDX_exam_results_term_student_class',
        columnNames: ['termId', 'studentId', 'classId'],
        isUnique: true,
      }),
    );

    // Manual Attendance
    await queryRunner.createTable(
      new Table({
        name: 'attendance_sessions',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'classId', type: 'varchar', length: '64' },
          { name: 'sessionDate', type: 'varchar', length: '32' },
          { name: 'topic', type: 'varchar', length: '255', isNullable: true },
          { name: 'countExcusedInDenominator', type: 'boolean', default: true },
          { name: 'createdById', type: 'varchar', length: '64', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'attendance_records',
        columns: [
          { name: 'id', type: 'varchar', length: '64', isPrimary: true },
          { name: 'sessionId', type: 'varchar', length: '64' },
          { name: 'studentId', type: 'varchar', length: '64' },
          { name: 'status', type: 'varchar', length: '32', default: "'present'" },
          { name: 'note', type: 'text', isNullable: true },
          { name: 'markedBy', type: 'varchar', length: '64', isNullable: true },
          { name: 'auditLog', type: 'text', isNullable: true },
          { name: 'createdAt', type: dt, default: 'CURRENT_TIMESTAMP' },
          { name: 'updatedAt', type: dt, default: 'CURRENT_TIMESTAMP' },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'attendance_records',
      new TableIndex({
        name: 'IDX_attendance_session_student',
        columnNames: ['sessionId', 'studentId'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      'attendance_records',
      'attendance_sessions',
      'exam_results',
      'academic_terms',
      'quiz_answers',
      'quiz_attempts',
      'quiz_options',
      'questions',
      'quizzes',
      'announcements',
      'notifications',
      'payments',
      'videos',
      'notes',
      'papers',
      'submissions',
      'assignments',
      'class_students',
      'classes',
      'users',
    ];
    for (const table of tables) {
      await queryRunner.dropTable(table, true);
    }
  }
}

