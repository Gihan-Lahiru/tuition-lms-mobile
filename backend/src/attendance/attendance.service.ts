import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import {
  AttendanceRecord,
  AttendanceSession,
} from '../database/entities/attendance.entity';
import { Class } from '../database/entities/class.entity';
import { computeAttendanceStats } from '../common/utils/grade.util';
import {
  CreateAttendanceSessionDto,
  SaveAttendanceRecordsDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AttendanceSession)
    private readonly sessionRepo: Repository<AttendanceSession>,
    @InjectRepository(AttendanceRecord)
    private readonly recordRepo: Repository<AttendanceRecord>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
  ) {}

  async createSession(dto: CreateAttendanceSessionDto, teacherId: string) {
    const cls = await this.classRepo.findOne({ where: { id: dto.classId } });
    if (!cls) throw new NotFoundException('Class not found');

    const duplicate = await this.sessionRepo.findOne({
      where: { classId: dto.classId, sessionDate: dto.sessionDate },
    });
    if (duplicate) {
      throw new ConflictException(
        `An attendance session already exists for ${cls.name} on ${dto.sessionDate}`,
      );
    }

    const session = this.sessionRepo.create({
      id: uuid(),
      classId: dto.classId,
      sessionDate: dto.sessionDate,
      topic: dto.topic?.trim() || '',
      countExcusedInDenominator: dto.countExcusedInDenominator ?? true,
      createdById: teacherId,
    });
    return this.sessionRepo.save(session);
  }

  async getClassSessions(classId: string) {
    const sessions = await this.sessionRepo.find({
      where: { classId },
      relations: ['records', 'records.student', 'class'],
      order: { sessionDate: 'DESC', createdAt: 'DESC' },
    });

    return sessions.map((s) => ({
      id: s.id,
      classId: s.classId,
      className: s.class?.name || 'Class',
      sessionDate: s.sessionDate,
      topic: s.topic,
      countExcusedInDenominator: s.countExcusedInDenominator,
      stats: computeAttendanceStats(s.records || [], {
        countExcusedInDenominator: s.countExcusedInDenominator,
      }),
      records: (s.records || []).map((r) => ({
        id: r.id,
        studentId: r.studentId,
        studentName: r.student?.name || 'Student',
        status: r.status,
        note: r.note,
        updatedAt: r.updatedAt,
      })),
    }));
  }

  async saveSessionRecords(
    sessionId: string,
    dto: SaveAttendanceRecordsDto,
    teacherId: string,
  ) {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
      relations: ['class', 'class.students'],
    });
    if (!session) throw new NotFoundException('Attendance session not found');

    const rosterIds = new Set((session.class?.students || []).map((s) => s.id));
    if (rosterIds.size > 0) {
      for (const rec of dto.records) {
        if (!rosterIds.has(rec.studentId)) {
          throw new BadRequestException(
            `Student ${rec.studentId} is not enrolled in class ${session.class?.name}`,
          );
        }
      }
    }

    const seenInPayload = new Set<string>();
    for (const rec of dto.records) {
      if (seenInPayload.has(rec.studentId)) {
        throw new BadRequestException(
          `Duplicate attendance entry in payload for student ${rec.studentId}`,
        );
      }
      seenInPayload.add(rec.studentId);
    }

    return this.dataSource.transaction(async (manager) => {
      const saved: AttendanceRecord[] = [];
      for (const rec of dto.records) {
        let existing = await manager.findOne(AttendanceRecord, {
          where: { sessionId, studentId: rec.studentId },
        });

        if (existing) {
          if (existing.status !== rec.status || existing.note !== (rec.note || null)) {
            let log: any[] = [];
            try {
              log = existing.auditLog ? JSON.parse(existing.auditLog) : [];
            } catch {
              log = [];
            }
            log.push({
              previousStatus: existing.status,
              nextStatus: rec.status,
              editedBy: teacherId,
              editedAt: new Date().toISOString(),
            });
            existing.auditLog = JSON.stringify(log);
          }
          existing.status = rec.status;
          existing.note = rec.note?.trim() || '';
          existing.markedBy = teacherId;
        } else {
          existing = manager.create(AttendanceRecord, {
            id: uuid(),
            sessionId,
            studentId: rec.studentId,
            status: rec.status,
            note: rec.note?.trim() || '',
            markedBy: teacherId,
            auditLog: JSON.stringify([
              {
                previousStatus: null,
                nextStatus: rec.status,
                editedBy: teacherId,
                editedAt: new Date().toISOString(),
              },
            ]),
          });
        }
        saved.push(await manager.save(existing));
      }
      return { sessionId, savedCount: saved.length };
    });
  }

  async getMyAttendance(studentId: string, monthFilter?: string) {
    const allRecords = await this.recordRepo.find({
      where: { studentId },
      relations: ['session', 'session.class'],
      order: { createdAt: 'DESC' },
    });

    const recordsWithSession = allRecords
      .filter((r) => r.session)
      .sort((a, b) =>
        (b.session?.sessionDate || '').localeCompare(a.session?.sessionDate || ''),
      );

    const overall = computeAttendanceStats(recordsWithSession, {
      countExcusedInDenominator: true,
    });

    const targetMonth =
      monthFilter && /^\d{4}-\d{2}$/.test(monthFilter)
        ? monthFilter
        : new Date().toISOString().slice(0, 7);

    const monthlyRecords = recordsWithSession.filter((r) =>
      (r.session?.sessionDate || '').startsWith(targetMonth),
    );

    // Respect per-session excused rule when monthly denominator varies, defaulting to standard
    const monthly = computeAttendanceStats(monthlyRecords, {
      countExcusedInDenominator:
        monthlyRecords[0]?.session?.countExcusedInDenominator ?? true,
    });

    return {
      month: targetMonth,
      monthlySummary: monthly,
      overallSummary: overall,
      history: recordsWithSession.map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        sessionDate: r.session?.sessionDate,
        classId: r.session?.classId,
        className: r.session?.class?.name || 'Class',
        subject: r.session?.class?.subject || '',
        topic: r.session?.topic || '',
        status: r.status,
        note: r.note || '',
      })),
    };
  }
}

