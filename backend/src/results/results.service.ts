import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { AcademicTerm, ExamResult } from '../database/entities/result.entity';
import { Class } from '../database/entities/class.entity';
import { Assignment } from '../database/entities/assignment.entity';
import { Submission } from '../database/entities/submission.entity';
import { QuizAttempt } from '../database/entities/quiz.entity';
import { Notification } from '../database/entities/notification.entity';
import {
  calculatePercentage,
  computeGradeLetter,
  normalizeGrade,
} from '../common/utils/grade.util';
import {
  CreateAcademicTermDto,
  PublishTermResultsDto,
  SaveResultsDto,
} from './dto/result.dto';

@Injectable()
export class ResultsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AcademicTerm)
    private readonly termRepo: Repository<AcademicTerm>,
    @InjectRepository(ExamResult)
    private readonly resultRepo: Repository<ExamResult>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(QuizAttempt)
    private readonly quizAttemptRepo: Repository<QuizAttempt>,
  ) {}

  listTerms() {
    return this.termRepo.find({ order: { year: 'DESC', createdAt: 'DESC' } });
  }

  createTerm(dto: CreateAcademicTermDto) {
    const term = this.termRepo.create({
      id: uuid(),
      name: dto.name.trim(),
      year: dto.year.trim(),
      grade: dto.grade?.trim(),
      isActive: true,
    });
    return this.termRepo.save(term);
  }

  async saveResults(dto: SaveResultsDto, teacherId: string) {
    const term = await this.termRepo.findOne({ where: { id: dto.termId } });
    if (!term) throw new NotFoundException('Academic term not found');

    const cls = await this.classRepo.findOne({ where: { id: dto.classId } });
    if (!cls) throw new NotFoundException('Class not found');

    for (const item of dto.results) {
      const maxMarks = item.maxMarks ?? 100;
      if (item.status === 'graded') {
        if (item.marks === null || item.marks === undefined) {
          throw new BadRequestException(
            `Marks are required when status is graded (student ${item.studentId})`,
          );
        }
        if (item.marks < 0 || item.marks > maxMarks) {
          throw new BadRequestException(
            `Marks must be between 0 and ${maxMarks} (student ${item.studentId})`,
          );
        }
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const savedResults: ExamResult[] = [];
      for (const item of dto.results) {
        const maxMarks = item.maxMarks ?? 100;
        const marks = item.status === 'graded' ? Number(item.marks) : null;
        const gradeLetter =
          item.status === 'graded' && marks !== null
            ? computeGradeLetter(calculatePercentage(marks, maxMarks))
            : null;

        let existing = await manager.findOne(ExamResult, {
          where: {
            termId: dto.termId,
            classId: dto.classId,
            studentId: item.studentId,
          },
        });

        if (existing) {
          existing.marks = marks;
          existing.maxMarks = maxMarks;
          existing.status = item.status;
          existing.gradeLetter = gradeLetter;
          existing.remarks = item.remarks?.trim() || '';
          if (typeof item.isPublished === 'boolean') {
            existing.isPublished = item.isPublished;
          }
          existing.updatedBy = teacherId;
        } else {
          existing = manager.create(ExamResult, {
            id: uuid(),
            termId: dto.termId,
            classId: dto.classId,
            studentId: item.studentId,
            marks,
            maxMarks,
            status: item.status,
            gradeLetter,
            remarks: item.remarks?.trim() || '',
            isPublished: item.isPublished ?? false,
            updatedBy: teacherId,
          });
        }
        savedResults.push(await manager.save(existing));
      }
      return savedResults;
    });
  }

  async publishResults(dto: PublishTermResultsDto) {
    const rows = await this.resultRepo.find({
      where: { termId: dto.termId, classId: dto.classId },
    });
    if (rows.length === 0) {
      throw new NotFoundException('No entered marks found for this term and class');
    }

    for (const r of rows) {
      r.isPublished = dto.isPublished;
    }
    await this.resultRepo.save(rows);

    if (dto.isPublished) {
      const term = await this.termRepo.findOne({ where: { id: dto.termId } });
      const notifRepo = this.dataSource.getRepository(Notification);
      for (const r of rows) {
        await notifRepo.save(
          notifRepo.create({
            id: uuid(),
            userId: r.studentId,
            title: 'Term Marks Published',
            message: `Your marks for ${term?.name || 'term exam'} are now available in Results.`,
            type: 'result',
          }),
        );
      }
    }

    return { updated: rows.length, isPublished: dto.isPublished };
  }

  async getClassTermSheet(classId: string, termId?: string) {
    const cls = await this.classRepo.findOne({
      where: { id: classId },
      relations: ['students'],
    });
    if (!cls) throw new NotFoundException('Class not found');

    const where: any = { classId };
    if (termId) where.termId = termId;

    const existing = await this.resultRepo.find({
      where,
      relations: ['student', 'term'],
    });

    const resultByStudent = new Map(existing.map((r) => [r.studentId, r]));
    const roster = (cls.students || []).filter((s) => s.role === 'student');

    const rows = roster.map((student) => {
      const rec = resultByStudent.get(student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        grade: student.grade,
        marks: rec?.marks ?? null,
        maxMarks: rec?.maxMarks ?? 100,
        status: rec?.status || 'not_graded',
        gradeLetter: rec?.gradeLetter || null,
        remarks: rec?.remarks || '',
        isPublished: rec?.isPublished ?? false,
        updatedAt: rec?.updatedAt || null,
      };
    });

    return {
      classId: cls.id,
      className: cls.name,
      termId: termId || null,
      rows,
    };
  }

  async getMyResults(student: { id: string; grade?: string }) {
    // Strictly returns ONLY published results belonging to the authenticated student. No class rank!
    const publishedResults = await this.resultRepo.find({
      where: { studentId: student.id, isPublished: true },
      relations: ['term', 'class'],
      order: { updatedAt: 'DESC' },
    });

    const gradedItems = publishedResults.filter(
      (r) => r.status === 'graded' && r.marks !== null && r.marks !== undefined,
    );
    const termPercentages = gradedItems.map((r) =>
      calculatePercentage(Number(r.marks), Number(r.maxMarks || 100)),
    );
    const termAveragePercentage =
      termPercentages.length > 0
        ? Number(
            (
              termPercentages.reduce((sum, v) => sum + v, 0) /
              termPercentages.length
            ).toFixed(1),
          )
        : null;

    // Assignment & Quiz progress metrics for the report card
    const classes = await this.classRepo.find({ relations: ['students'] });
    const norm = normalizeGrade(student.grade);
    const classIds = classes
      .filter(
        (c) =>
          c.students?.some((s) => s.id === student.id) ||
          (norm && normalizeGrade(c.grade) === norm),
      )
      .map((c) => c.id);

    const assignments =
      classIds.length > 0
        ? await this.assignmentRepo.find({ where: { classId: In(classIds) } })
        : [];
    const submissions = await this.submissionRepo.find({
      where: { studentId: student.id },
    });
    const assignmentCompletionRate =
      assignments.length > 0
        ? Math.round((submissions.length / assignments.length) * 100)
        : 0;

    const quizAttempts = (
      await this.quizAttemptRepo.find({
        where: { studentId: student.id },
        relations: ['quiz'],
        order: { submittedAt: 'DESC' },
      })
    ).filter((a) => a.status !== 'in_progress');

    const quizAveragePercentage =
      quizAttempts.length > 0
        ? Number(
            (
              quizAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) /
              quizAttempts.length
            ).toFixed(1),
          )
        : null;

    return {
      results: publishedResults.map((r) => ({
        id: r.id,
        termId: r.termId,
        termName: r.term?.name || 'Academic Term',
        year: r.term?.year || '',
        classId: r.classId,
        className: r.class?.name || 'Class',
        subject: r.class?.subject || '',
        marks: r.status === 'graded' ? r.marks : null,
        maxMarks: r.maxMarks,
        percentage:
          r.status === 'graded' && r.marks !== null && r.marks !== undefined
            ? calculatePercentage(Number(r.marks), Number(r.maxMarks || 100))
            : null,
        status: r.status, // 'graded' | 'absent' | 'not_graded'
        gradeLetter: r.gradeLetter,
        remarks: r.remarks,
        updatedAt: r.updatedAt,
      })),
      summary: {
        publishedCount: publishedResults.length,
        gradedCount: gradedItems.length,
        absentCount: publishedResults.filter((r) => r.status === 'absent').length,
        termAveragePercentage,
        overallGradeLetter:
          termAveragePercentage !== null
            ? computeGradeLetter(termAveragePercentage)
            : null,
        assignmentCompletionRate,
        assignmentsCompleted: submissions.length,
        assignmentsTotal: assignments.length,
        quizzesCompleted: quizAttempts.length,
        quizAveragePercentage,
      },
      quizHistory: quizAttempts.map((a) => ({
        attemptId: a.id,
        quizId: a.quizId,
        quizTitle: a.quiz?.title || 'Quiz',
        score: a.score,
        maxScore: a.maxScore,
        percentage: a.percentage,
        status: a.status,
        submittedAt: a.submittedAt,
      })),
    };
  }
}

