import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import {
  Question,
  Quiz,
  QuizAnswer,
  QuizAttempt,
  QuizOption,
} from '../database/entities/quiz.entity';
import { Class } from '../database/entities/class.entity';
import {
  CreateQuizDto,
  RegradeAttemptDto,
  SaveAttemptAnswersDto,
  UpdateQuizAnswerKeyDto,
  UpdateQuizSettingsDto,
} from './dto/quiz.dto';
import { normalizeGrade } from '../common/utils/grade.util';

const EXPIRY_GRACE_MS = 5000;

@Injectable()
export class QuizzesService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Quiz)
    private readonly quizRepo: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(QuizOption)
    private readonly optionRepo: Repository<QuizOption>,
    @InjectRepository(QuizAttempt)
    private readonly attemptRepo: Repository<QuizAttempt>,
    @InjectRepository(QuizAnswer)
    private readonly answerRepo: Repository<QuizAnswer>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
  ) {}

  private parseSelectedOptionIds(answer?: QuizAnswer | null): string[] {
    if (!answer) return [];
    if (answer.selectedOptionIds) {
      try {
        const parsed = JSON.parse(answer.selectedOptionIds);
        if (Array.isArray(parsed)) {
          return [...new Set(parsed.filter(Boolean).map(String))];
        }
      } catch {
        // fallback below
      }
    }
    return answer.selectedOptionId ? [answer.selectedOptionId] : [];
  }

  private evaluateExactMatch(selectedIds: string[], options: QuizOption[]): boolean {
    const correctIds = (options || []).filter((o) => o.isCorrect).map((o) => o.id);
    if (correctIds.length === 0 || selectedIds.length !== correctIds.length) {
      return false;
    }
    const chosenSet = new Set(selectedIds);
    return correctIds.every((id) => chosenSet.has(id));
  }

  async createQuiz(dto: CreateQuizDto, teacherId: string) {
    const cls = await this.classRepo.findOne({ where: { id: dto.classId } });
    if (!cls) throw new NotFoundException('Class not found');

    for (let i = 0; i < dto.questions.length; i++) {
      const q = dto.questions[i];
      const qType = q.questionType || 'single_choice';
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      if (correctCount === 0) {
        throw new BadRequestException(
          `Question ${i + 1} must have at least one correct option`,
        );
      }
      if (qType === 'single_choice' && correctCount > 1) {
        throw new BadRequestException(
          `Question ${i + 1} is single choice so only one correct option is allowed`,
        );
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const quizId = uuid();
      const quiz = manager.create(Quiz, {
        id: quizId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        classId: cls.id,
        grade: cls.grade,
        durationMinutes: dto.durationMinutes,
        opensAt: dto.opensAt ? new Date(dto.opensAt) : null,
        closesAt: dto.closesAt ? new Date(dto.closesAt) : null,
        isPublished: dto.isPublished ?? true,
        shuffleQuestions: dto.shuffleQuestions ?? false,
        releaseAnswersAfterSubmit: dto.releaseAnswersAfterSubmit ?? true,
        maxAttempts: dto.maxAttempts ?? 1,
        createdById: teacherId,
      });
      await manager.save(quiz);

      for (let qIdx = 0; qIdx < dto.questions.length; qIdx++) {
        const qDto = dto.questions[qIdx];
        const qId = uuid();
        const question = manager.create(Question, {
          id: qId,
          quizId,
          prompt: qDto.prompt.trim(),
          questionType: qDto.questionType || 'single_choice',
          explanation: qDto.explanation?.trim(),
          marks: qDto.marks ?? 1,
          orderIndex: qIdx,
        });
        await manager.save(question);

        for (let oIdx = 0; oIdx < qDto.options.length; oIdx++) {
          const oDto = qDto.options[oIdx];
          const option = manager.create(QuizOption, {
            id: uuid(),
            questionId: qId,
            label: oDto.label.trim(),
            isCorrect: Boolean(oDto.isCorrect),
            orderIndex: oIdx,
          });
          await manager.save(option);
        }
      }

      return manager.findOne(Quiz, {
        where: { id: quizId },
        relations: ['questions', 'questions.options', 'class'],
      });
    });
  }

  async updateSettings(quizId: string, dto: UpdateQuizSettingsDto) {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (typeof dto.isPublished === 'boolean') {
      quiz.isPublished = dto.isPublished;
    }
    if (typeof dto.releaseAnswersAfterSubmit === 'boolean') {
      quiz.releaseAnswersAfterSubmit = dto.releaseAnswersAfterSubmit;
    }
    return this.quizRepo.save(quiz);
  }

  async listQuizzes(user: { id: string; role: string; grade?: string }) {
    const isTeacher = user.role === 'teacher' || user.role === 'admin';
    const quizzes = await this.quizRepo.find({
      where: isTeacher ? {} : { isPublished: true },
      relations: ['questions', 'class'],
      order: { createdAt: 'DESC' },
    });

    const userNormGrade = normalizeGrade(user.grade);
    const filtered = isTeacher
      ? quizzes
      : quizzes.filter((q) => !userNormGrade || normalizeGrade(q.grade) === userNormGrade);

    const quizIds = filtered.map((q) => q.id);
    const attempts =
      quizIds.length > 0
        ? await this.attemptRepo.find({
            where: isTeacher
              ? { quizId: In(quizIds) }
              : { quizId: In(quizIds), studentId: user.id },
            order: { startedAt: 'DESC' },
          })
        : [];

    return filtered.map((quiz) => {
      const qTotalMarks = (quiz.questions || []).reduce(
        (sum, q) => sum + (q.marks || 1),
        0,
      );
      const qAttempts = attempts.filter((a) => a.quizId === quiz.id);
      const activeAttempt = !isTeacher
        ? qAttempts.find((a) => a.status === 'in_progress') || null
        : null;
      const latestCompleted = !isTeacher
        ? qAttempts.find((a) => a.status !== 'in_progress') || null
        : null;

      return {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        classId: quiz.classId,
        className: quiz.class?.name || 'Class',
        subject: quiz.class?.subject || '',
        grade: quiz.grade,
        durationMinutes: quiz.durationMinutes,
        opensAt: quiz.opensAt,
        closesAt: quiz.closesAt,
        isPublished: quiz.isPublished,
        shuffleQuestions: quiz.shuffleQuestions,
        releaseAnswersAfterSubmit: quiz.releaseAnswersAfterSubmit,
        maxAttempts: quiz.maxAttempts,
        questionCount: quiz.questions?.length || 0,
        totalMarks: qTotalMarks,
        attemptCount: qAttempts.length,
        activeAttemptId: activeAttempt?.id || null,
        latestCompletedAttempt: latestCompleted
          ? {
              id: latestCompleted.id,
              status: latestCompleted.status,
              score: latestCompleted.score,
              maxScore: latestCompleted.maxScore,
              percentage: latestCompleted.percentage,
              submittedAt: latestCompleted.submittedAt,
            }
          : null,
        createdAt: quiz.createdAt,
      };
    });
  }

  /**
   * Returns quiz structure; strips all answer key booleans and explanations from students!
   */
  async getQuizDetails(quizId: string, user: { role: string }) {
    const quiz = await this.quizRepo.findOne({
      where: { id: quizId },
      relations: ['questions', 'questions.options', 'class'],
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const isTeacher = user.role === 'teacher' || user.role === 'admin';
    if (!isTeacher && !quiz.isPublished) {
      throw new ForbiddenException('This quiz is not currently published');
    }

    const questions = [...(quiz.questions || [])]
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((q) => ({
        id: q.id,
        prompt: q.prompt,
        questionType: q.questionType || 'single_choice',
        marks: q.marks,
        orderIndex: q.orderIndex,
        ...(isTeacher ? { explanation: q.explanation } : {}),
        options: [...(q.options || [])]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((o) => ({
            id: o.id,
            label: o.label,
            orderIndex: o.orderIndex,
            ...(isTeacher ? { isCorrect: o.isCorrect } : {}),
          })),
      }));

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      classId: quiz.classId,
      className: quiz.class?.name || 'Class',
      grade: quiz.grade,
      durationMinutes: quiz.durationMinutes,
      opensAt: quiz.opensAt,
      closesAt: quiz.closesAt,
      isPublished: quiz.isPublished,
      shuffleQuestions: quiz.shuffleQuestions,
      releaseAnswersAfterSubmit: quiz.releaseAnswersAfterSubmit,
      maxAttempts: quiz.maxAttempts,
      totalMarks: questions.reduce((sum, q) => sum + (q.marks || 1), 0),
      questions,
    };
  }

  private deterministicOrder(questions: Question[], seed: number, shuffle: boolean) {
    const sorted = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);
    if (!shuffle || sorted.length <= 1) return sorted;
    // Simple deterministic LCG using persisted randomSeed so reconnect preserves order
    let state = seed || 1;
    const arr = [...sorted];
    for (let i = arr.length - 1; i > 0; i--) {
      state = (state * 1664525 + 1013904223) % 4294967296;
      const j = state % (i + 1);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private sanitizeAttemptPayload(
    attempt: QuizAttempt,
    quiz: Quiz,
    savedAnswers: QuizAnswer[],
  ) {
    const orderedQuestions = this.deterministicOrder(
      quiz.questions || [],
      attempt.randomSeed || 1,
      quiz.shuffleQuestions,
    );
    const now = Date.now();
    const expiresMs = new Date(attempt.expiresAt).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiresMs - now) / 1000));

    return {
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        status: attempt.status,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
        remainingSeconds,
        serverNow: new Date(now).toISOString(),
        tabSwitchCount: attempt.tabSwitchCount,
      },
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        durationMinutes: quiz.durationMinutes,
        totalMarks: orderedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0),
        releaseAnswersAfterSubmit: quiz.releaseAnswersAfterSubmit,
      },
      questions: orderedQuestions.map((q) => ({
        id: q.id,
        prompt: q.prompt,
        questionType: q.questionType || 'single_choice',
        marks: q.marks,
        options: [...(q.options || [])]
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((o) => ({
            id: o.id,
            label: o.label,
          })),
      })),
      savedAnswers: savedAnswers.reduce<Record<string, string[]>>((acc, a) => {
        acc[a.questionId] = this.parseSelectedOptionIds(a);
        return acc;
      }, {}),
    };
  }

  async startOrResumeAttempt(quizId: string, studentId: string) {
    const quiz = await this.quizRepo.findOne({
      where: { id: quizId },
      relations: ['questions', 'questions.options'],
    });
    if (!quiz) throw new NotFoundException('Quiz not found');
    if (!quiz.isPublished) {
      throw new ForbiddenException('Quiz is not published');
    }

    const now = new Date();
    if (quiz.opensAt && now < new Date(quiz.opensAt)) {
      throw new BadRequestException('Quiz has not opened yet');
    }

    const existingAttempts = await this.attemptRepo.find({
      where: { quizId, studentId },
      order: { startedAt: 'DESC' },
    });

    const inProgress = existingAttempts.find((a) => a.status === 'in_progress');
    if (inProgress) {
      if (now.getTime() > new Date(inProgress.expiresAt).getTime() + EXPIRY_GRACE_MS) {
        // Server deadline elapsed while disconnected -> auto-submit cleanly
        await this.finalizeAttempt(inProgress.id, studentId, true);
      } else {
        const answers = await this.answerRepo.find({
          where: { attemptId: inProgress.id },
        });
        return {
          resumed: true,
          ...this.sanitizeAttemptPayload(inProgress, quiz, answers),
        };
      }
    }

    if (quiz.closesAt && now > new Date(quiz.closesAt)) {
      throw new BadRequestException('Quiz window has closed');
    }

    const completedCount = (
      await this.attemptRepo.find({ where: { quizId, studentId } })
    ).filter((a) => a.status !== 'in_progress').length;

    if (completedCount >= quiz.maxAttempts) {
      throw new BadRequestException(
        `Maximum attempts (${quiz.maxAttempts}) reached for this quiz`,
      );
    }

    const deadlineByDuration = new Date(
      now.getTime() + quiz.durationMinutes * 60 * 1000,
    );
    const expiresAt =
      quiz.closesAt && new Date(quiz.closesAt) < deadlineByDuration
        ? new Date(quiz.closesAt)
        : deadlineByDuration;

    const maxScore = (quiz.questions || []).reduce(
      (sum, q) => sum + (q.marks || 1),
      0,
    );

    const attempt = this.attemptRepo.create({
      id: uuid(),
      quizId,
      studentId,
      status: 'in_progress',
      randomSeed: Math.floor(Math.random() * 1000000) + 1,
      startedAt: now,
      expiresAt,
      maxScore,
      score: 0,
      percentage: 0,
      tabSwitchCount: 0,
    });
    await this.attemptRepo.save(attempt);

    return {
      resumed: false,
      ...this.sanitizeAttemptPayload(attempt, quiz, []),
    };
  }

  async saveAnswers(
    attemptId: string,
    studentId: string,
    dto: SaveAttemptAnswersDto,
  ) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Quiz attempt not found');
    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('You cannot modify another student’s attempt');
    }
    if (attempt.status !== 'in_progress') {
      throw new BadRequestException('Quiz attempt has already been submitted');
    }

    const now = Date.now();
    if (now > new Date(attempt.expiresAt).getTime() + EXPIRY_GRACE_MS) {
      const autoResult = await this.finalizeAttempt(attemptId, studentId, true);
      throw new BadRequestException({
        code: 'QUIZ_TIME_EXPIRED',
        message: 'Time expired. Your previously saved answers have been submitted.',
        result: autoResult,
      });
    }

    const questions = await this.questionRepo.find({
      where: { quizId: attempt.quizId },
      relations: ['options'],
    });
    const questionMap = new Map(questions.map((q) => [q.id, q]));

    await this.dataSource.transaction(async (manager) => {
      if (typeof dto.tabSwitchCount === 'number' && dto.tabSwitchCount > attempt.tabSwitchCount) {
        attempt.tabSwitchCount = dto.tabSwitchCount;
        await manager.save(attempt);
      }

      for (const item of dto.answers) {
        const question = questionMap.get(item.questionId);
        if (!question) {
          throw new BadRequestException(`Question ${item.questionId} does not belong to this quiz`);
        }
        const rawIds = Array.isArray(item.selectedOptionIds)
          ? item.selectedOptionIds
          : item.selectedOptionId
            ? [item.selectedOptionId]
            : [];
        const uniqueIds = [...new Set(rawIds.filter(Boolean).map(String))];
        const qType = question.questionType || 'single_choice';

        if (qType === 'single_choice' && uniqueIds.length > 1) {
          throw new BadRequestException(
            `Question ${item.questionId} is single choice and allows only one selected option`,
          );
        }

        const validOptionSet = new Set((question.options || []).map((o) => o.id));
        for (const optId of uniqueIds) {
          if (!validOptionSet.has(optId)) {
            throw new BadRequestException(
              `Option ${optId} does not belong to question ${item.questionId}`,
            );
          }
        }

        const existing = await manager.findOne(QuizAnswer, {
          where: { attemptId, questionId: item.questionId },
        });
        const encoded = JSON.stringify(uniqueIds);
        if (existing) {
          existing.selectedOptionId = uniqueIds[0] ?? null;
          existing.selectedOptionIds = encoded;
          await manager.save(existing);
        } else {
          const created = manager.create(QuizAnswer, {
            id: uuid(),
            attemptId,
            questionId: item.questionId,
            selectedOptionId: uniqueIds[0] ?? null,
            selectedOptionIds: encoded,
          });
          await manager.save(created);
        }
      }
    });

    return {
      saved: true,
      attemptId,
      remainingSeconds: Math.max(
        0,
        Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000),
      ),
    };
  }

  async submitAttempt(attemptId: string, studentId: string) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Quiz attempt not found');
    if (attempt.studentId !== studentId) {
      throw new ForbiddenException('You cannot submit another student’s attempt');
    }

    // Idempotent repeat submission: return scored result without duplicating scores
    if (attempt.status !== 'in_progress') {
      return this.getAttemptResult(attemptId, { id: studentId, role: 'student' });
    }

    const isExpired =
      Date.now() > new Date(attempt.expiresAt).getTime() + EXPIRY_GRACE_MS;
    await this.finalizeAttempt(attemptId, studentId, isExpired);
    return this.getAttemptResult(attemptId, { id: studentId, role: 'student' });
  }

  private async finalizeAttempt(
    attemptId: string,
    studentId: string,
    expired: boolean,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const attempt = await manager.findOne(QuizAttempt, {
        where: { id: attemptId, studentId },
      });
      if (!attempt) throw new NotFoundException('Attempt not found');
      if (attempt.status !== 'in_progress') {
        return attempt;
      }

      const questions = await manager.find(Question, {
        where: { quizId: attempt.quizId },
        relations: ['options'],
      });
      const savedAnswers = await manager.find(QuizAnswer, {
        where: { attemptId },
      });
      const answerMap = new Map(savedAnswers.map((a) => [a.questionId, a]));

      let score = 0;
      let maxScore = 0;

      for (const question of questions) {
        const marks = question.marks || 1;
        maxScore += marks;
        const ans = answerMap.get(question.id);
        const chosenIds = this.parseSelectedOptionIds(ans);

        if (ans && chosenIds.length > 0) {
          const isCorrect = this.evaluateExactMatch(chosenIds, question.options || []);
          ans.isCorrect = isCorrect;
          ans.awardedMarks = isCorrect ? marks : 0;
          score += ans.awardedMarks;
          await manager.save(ans);
        } else if (ans) {
          ans.isCorrect = false;
          ans.awardedMarks = 0;
          await manager.save(ans);
        }
      }

      attempt.score = score;
      attempt.maxScore = maxScore;
      attempt.percentage =
        maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;
      attempt.status = expired ? 'auto_submitted' : 'submitted';
      attempt.submittedAt = new Date();

      return manager.save(attempt);
    });
  }

  async getAttemptResult(
    attemptId: string,
    requester: { id: string; role: string },
  ) {
    const attempt = await this.attemptRepo.findOne({
      where: { id: attemptId },
      relations: ['quiz', 'student'],
    });
    if (!attempt) throw new NotFoundException('Attempt not found');

    const isTeacher = requester.role === 'teacher' || requester.role === 'admin';
    if (!isTeacher && attempt.studentId !== requester.id) {
      throw new ForbiddenException('You can only view your own quiz results');
    }

    if (attempt.status === 'in_progress') {
      throw new BadRequestException(
        'Answer keys and final scores cannot be viewed before submission',
      );
    }

    const canRevealKey = isTeacher || Boolean(attempt.quiz?.releaseAnswersAfterSubmit);

    const questions = await this.questionRepo.find({
      where: { quizId: attempt.quizId },
      relations: ['options'],
      order: { orderIndex: 'ASC' },
    });
    const answers = await this.answerRepo.find({ where: { attemptId } });
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));

    const breakdown = questions.map((q) => {
      const ans = answerMap.get(q.id);
      const selectedIds = this.parseSelectedOptionIds(ans);
      const correctOptionIds = (q.options || [])
        .filter((o) => o.isCorrect)
        .map((o) => o.id);
      return {
        questionId: q.id,
        prompt: q.prompt,
        questionType: q.questionType || 'single_choice',
        marks: q.marks,
        selectedOptionId: ans?.selectedOptionId || null,
        selectedOptionIds: selectedIds,
        awardedMarks: ans?.awardedMarks || 0,
        isCorrect: ans?.isCorrect ?? false,
        ...(canRevealKey
          ? {
              correctOptionId: correctOptionIds[0] || null,
              correctOptionIds,
              explanation: q.explanation || null,
              options: (q.options || [])
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((o) => ({
                  id: o.id,
                  label: o.label,
                  isCorrect: o.isCorrect,
                })),
            }
          : {
              options: (q.options || [])
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((o) => ({
                  id: o.id,
                  label: o.label,
                })),
            }),
      };
    });

    return {
      attemptId: attempt.id,
      quizId: attempt.quizId,
      quizTitle: attempt.quiz?.title || 'Quiz',
      studentName: attempt.student?.name || 'Student',
      status: attempt.status,
      score: attempt.score,
      maxScore: attempt.maxScore,
      percentage: attempt.percentage,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      tabSwitchCount: attempt.tabSwitchCount,
      answersReleased: canRevealKey,
      breakdown,
    };
  }

  async listQuizAttemptsForTeacher(quizId: string) {
    const quiz = await this.quizRepo.findOne({ where: { id: quizId } });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const attempts = await this.attemptRepo.find({
      where: { quizId },
      relations: ['student'],
      order: { submittedAt: 'DESC', startedAt: 'DESC' },
    });

    return attempts.map((a) => ({
      id: a.id,
      quizId: a.quizId,
      studentId: a.studentId,
      studentName: a.student?.name || 'Student',
      studentGrade: a.student?.grade || '',
      status: a.status,
      score: a.score,
      maxScore: a.maxScore,
      percentage: a.percentage,
      tabSwitchCount: a.tabSwitchCount,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
    }));
  }

  async manualRegrade(attemptId: string, dto: RegradeAttemptDto) {
    const attempt = await this.attemptRepo.findOne({ where: { id: attemptId } });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (dto.score < 0 || dto.score > attempt.maxScore) {
      throw new BadRequestException(
        `Regrade score must be between 0 and ${attempt.maxScore}`,
      );
    }
    attempt.score = dto.score;
    attempt.percentage =
      attempt.maxScore > 0
        ? Number(((dto.score / attempt.maxScore) * 100).toFixed(2))
        : 0;
    attempt.status = 'regraded';
    return this.attemptRepo.save(attempt);
  }

  /**
   * Lets a teacher update question types (single_choice / multiple_choice)
   * and select the correct answer(s) on an existing quiz, re-scoring submitted attempts cleanly.
   */
  async updateAnswerKey(quizId: string, dto: UpdateQuizAnswerKeyDto) {
    const quiz = await this.quizRepo.findOne({
      where: { id: quizId },
      relations: ['questions', 'questions.options'],
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    const questionMap = new Map((quiz.questions || []).map((q) => [q.id, q]));

    await this.dataSource.transaction(async (manager) => {
      for (const item of dto.questions) {
        const question = questionMap.get(item.questionId);
        if (!question) {
          throw new BadRequestException(`Question ${item.questionId} not found in quiz`);
        }
        const nextType = item.questionType || question.questionType || 'single_choice';
        const validIds = new Set((question.options || []).map((o) => o.id));
        const uniqueCorrect = [...new Set(item.correctOptionIds)];
        if (nextType === 'single_choice' && uniqueCorrect.length > 1) {
          throw new BadRequestException(
            `Single-choice question "${question.prompt}" can only have one correct option`,
          );
        }
        for (const oid of uniqueCorrect) {
          if (!validIds.has(oid)) {
            throw new BadRequestException(`Option ${oid} does not belong to question`);
          }
        }

        question.questionType = nextType;
        await manager.save(question);

        const correctSet = new Set(uniqueCorrect);
        for (const opt of question.options || []) {
          opt.isCorrect = correctSet.has(opt.id);
          await manager.save(opt);
        }
      }

      // Refresh questions after key change and re-evaluate submitted attempts
      const updatedQuestions = await manager.find(Question, {
        where: { quizId },
        relations: ['options'],
      });
      const submittedAttempts = (
        await manager.find(QuizAttempt, { where: { quizId } })
      ).filter((a) => a.status !== 'in_progress');

      for (const attempt of submittedAttempts) {
        const answers = await manager.find(QuizAnswer, {
          where: { attemptId: attempt.id },
        });
        const ansMap = new Map(answers.map((a) => [a.questionId, a]));
        let score = 0;
        let maxScore = 0;

        for (const q of updatedQuestions) {
          const marks = q.marks || 1;
          maxScore += marks;
          const ans = ansMap.get(q.id);
          const chosen = this.parseSelectedOptionIds(ans);
          if (ans) {
            const ok = chosen.length > 0 && this.evaluateExactMatch(chosen, q.options || []);
            ans.isCorrect = ok;
            ans.awardedMarks = ok ? marks : 0;
            score += ans.awardedMarks;
            await manager.save(ans);
          }
        }

        attempt.score = score;
        attempt.maxScore = maxScore;
        attempt.percentage =
          maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;
        await manager.save(attempt);
      }
    });

    return this.getQuizDetails(quizId, { role: 'teacher' });
  }
}

