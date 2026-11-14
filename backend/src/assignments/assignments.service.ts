import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { Assignment } from '../database/entities/assignment.entity';
import { Submission } from '../database/entities/submission.entity';
import { Class } from '../database/entities/class.entity';
import { Notification } from '../database/entities/notification.entity';
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
  SubmitAssignmentDto,
} from './dto/assignment.dto';
import { normalizeGrade } from '../common/utils/grade.util';
import {
  ensureUploadSubdir,
  sanitizeFilename,
  validateUploadedFile,
} from '../common/utils/file-validation.util';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(Assignment)
    private readonly assignmentRepo: Repository<Assignment>,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  async create(classId: string, dto: CreateAssignmentDto, teacherId: string) {
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException('Class not found');

    const assignment = this.assignmentRepo.create({
      id: uuid(),
      classId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      maxMarks: dto.maxMarks || 100,
      allowLateSubmission: dto.allowLateSubmission ?? true,
      createdById: teacherId,
    });
    return this.assignmentRepo.save(assignment);
  }

  async findByClass(classId: string) {
    return this.assignmentRepo.find({
      where: { classId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllForTeacher() {
    const assignments = await this.assignmentRepo.find({
      relations: ['class', 'submissions'],
      order: { createdAt: 'DESC' },
    });
    return assignments.map((a) => ({
      ...a,
      className: a.class?.name,
      grade: a.class?.grade,
      submissionCount: a.submissions?.length || 0,
      pendingGradeCount: (a.submissions || []).filter((s) => s.status !== 'graded').length,
    }));
  }

  async findMyAssignments(user: { id: string; grade?: string; role: string }) {
    if (user.role === 'teacher' || user.role === 'admin') {
      return { assignments: await this.findAllForTeacher(), summary: null };
    }

    const classes = await this.classRepo.find({ relations: ['students'] });
    const normGrade = normalizeGrade(user.grade);
    const matchingClassIds = classes
      .filter(
        (c) =>
          c.students?.some((s) => s.id === user.id) ||
          (normGrade && normalizeGrade(c.grade) === normGrade),
      )
      .map((c) => c.id);

    if (matchingClassIds.length === 0) {
      return {
        assignments: [],
        summary: { total: 0, completed: 0, graded: 0, pending: 0, completionRate: 0 },
      };
    }

    const assignments = await this.assignmentRepo.find({
      where: { classId: In(matchingClassIds) },
      relations: ['class'],
      order: { dueDate: 'ASC', createdAt: 'DESC' },
    });

    const submissions = await this.submissionRepo.find({
      where: { studentId: user.id },
    });
    const subMap = new Map(submissions.map((s) => [s.assignmentId, s]));

    const now = new Date();
    const enriched = assignments.map((a) => {
      const sub = subMap.get(a.id) || null;
      const isOverdue = Boolean(a.dueDate && now > new Date(a.dueDate) && !sub);
      let effectiveStatus = 'pending';
      if (sub) {
        effectiveStatus = sub.status;
      } else if (isOverdue) {
        effectiveStatus = 'overdue';
      }
      return {
        id: a.id,
        classId: a.classId,
        className: a.class?.name || 'Class',
        subject: a.class?.subject || '',
        title: a.title,
        description: a.description,
        dueDate: a.dueDate,
        maxMarks: a.maxMarks,
        allowLateSubmission: a.allowLateSubmission,
        createdAt: a.createdAt,
        effectiveStatus,
        submission: sub
          ? {
              id: sub.id,
              answerText: sub.answerText,
              fileUrl: sub.fileUrl,
              originalFileName: sub.originalFileName,
              status: sub.status,
              isLate: sub.isLate,
              marks: sub.marks,
              remarks: sub.remarks,
              submittedAt: sub.submittedAt,
              gradedAt: sub.gradedAt,
            }
          : null,
      };
    });

    const total = enriched.length;
    const completed = enriched.filter((x) => Boolean(x.submission)).length;
    const graded = enriched.filter((x) => x.submission?.status === 'graded').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      assignments: enriched,
      summary: {
        total,
        completed,
        graded,
        pending: total - completed,
        completionRate,
      },
    };
  }

  async submit(
    assignmentId: string,
    studentId: string,
    dto: SubmitAssignmentDto,
    file?: Express.Multer.File,
  ) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
    });
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    const answerText = dto.answerText?.trim() || '';
    if (!answerText && !file) {
      throw new BadRequestException(
        'Please provide a written answer or attach a PDF/image file',
      );
    }

    const existing = await this.submissionRepo.findOne({
      where: { assignmentId, studentId },
    });
    if (existing && existing.status === 'graded') {
      throw new BadRequestException('Cannot modify a submission after it has been graded');
    }

    const now = new Date();
    const isLate = Boolean(assignment.dueDate && now > new Date(assignment.dueDate));
    if (isLate && !assignment.allowLateSubmission) {
      throw new BadRequestException(
        'Submission deadline has passed and late submissions are closed',
      );
    }

    let fileUrl = existing?.fileUrl || null;
    let originalFileName = existing?.originalFileName || null;
    let mimeType = existing?.mimeType || null;

    if (file) {
      validateUploadedFile(file);
      const dir = ensureUploadSubdir('submissions');
      const storedName = `${uuid()}_${sanitizeFilename(file.originalname)}`;
      const fullPath = path.join(dir, storedName);
      fs.writeFileSync(fullPath, file.buffer);
      fileUrl = `/uploads/submissions/${storedName}`;
      originalFileName = file.originalname;
      mimeType = file.mimetype;
    }

    const submission = existing
      ? Object.assign(existing, {
          answerText: answerText || existing.answerText,
          fileUrl,
          originalFileName,
          mimeType,
          isLate,
          status: isLate ? 'late' : 'submitted',
        })
      : this.submissionRepo.create({
          id: uuid(),
          assignmentId,
          studentId,
          answerText,
          fileUrl,
          originalFileName,
          mimeType,
          isLate,
          status: isLate ? 'late' : 'submitted',
        });

    return this.submissionRepo.save(submission);
  }

  async getSubmissionsByAssignment(assignmentId: string) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const submissions = await this.submissionRepo.find({
      where: { assignmentId },
      relations: ['student'],
      order: { submittedAt: 'DESC' },
    });

    return submissions.map((s) => ({
      id: s.id,
      assignmentId: s.assignmentId,
      studentId: s.studentId,
      studentName: s.student?.name || 'Student',
      studentGrade: s.student?.grade || '',
      answerText: s.answerText,
      fileUrl: s.fileUrl,
      originalFileName: s.originalFileName,
      status: s.status,
      isLate: s.isLate,
      marks: s.marks,
      maxMarks: assignment.maxMarks,
      remarks: s.remarks,
      submittedAt: s.submittedAt,
      gradedAt: s.gradedAt,
      gradedBy: s.gradedBy,
    }));
  }

  async gradeSubmission(
    submissionId: string,
    dto: GradeSubmissionDto,
    teacherId: string,
  ) {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['assignment'],
    });
    if (!submission) throw new NotFoundException('Submission not found');

    const maxMarks = submission.assignment?.maxMarks ?? 100;
    if (dto.marks < 0 || dto.marks > maxMarks) {
      throw new BadRequestException(`Marks must be between 0 and ${maxMarks}`);
    }

    submission.marks = dto.marks;
    submission.remarks = dto.remarks?.trim() || '';
    submission.status = 'graded';
    submission.gradedBy = teacherId;
    submission.gradedAt = new Date();

    const saved = await this.submissionRepo.save(submission);

    await this.notificationRepo.save(
      this.notificationRepo.create({
        id: uuid(),
        userId: submission.studentId,
        title: 'Assignment Graded',
        message: `Your submission for "${submission.assignment?.title || 'Assignment'}" received ${dto.marks}/${maxMarks}.`,
        type: 'assignment',
      }),
    );

    return saved;
  }

  async getProtectedSubmissionFile(
    submissionId: string,
    requester: { id: string; role: string },
  ) {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
    });
    if (!submission || !submission.fileUrl) {
      throw new NotFoundException('Submission file not found');
    }
    if (requester.role === 'student' && submission.studentId !== requester.id) {
      throw new ForbiddenException('You can only access your own submission files');
    }

    const uploadRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const rel = submission.fileUrl.split('/uploads/')[1];
    const absPath = path.join(uploadRoot, rel || '');
    if (!rel || !fs.existsSync(absPath)) {
      throw new NotFoundException('Uploaded file not found on storage');
    }
    return {
      absPath,
      fileName: submission.originalFileName || path.basename(absPath),
      mimeType: submission.mimeType || 'application/octet-stream',
    };
  }
}

