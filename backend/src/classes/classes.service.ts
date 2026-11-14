import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Class } from '../database/entities/class.entity';
import { User } from '../database/entities/user.entity';
import { Announcement } from '../database/entities/announcement.entity';
import { normalizeGrade } from '../common/utils/grade.util';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Announcement)
    private readonly announcementRepo: Repository<Announcement>,
  ) {}

  async findAll() {
    return this.classRepo.find({
      relations: ['teacher', 'students'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyClasses(user: { id: string; role: string; grade?: string }) {
    const all = await this.classRepo.find({
      relations: ['teacher', 'students'],
      order: { createdAt: 'DESC' },
    });

    if (user.role === 'teacher' || user.role === 'admin') {
      return all.map((c) => ({
        ...c,
        studentCount: c.students?.length || 0,
      }));
    }

    const userNormGrade = normalizeGrade(user.grade);
    const enrolled = all.filter(
      (c) =>
        c.students?.some((s) => s.id === user.id) ||
        (userNormGrade && normalizeGrade(c.grade) === userNormGrade),
    );

    return enrolled.map((c) => ({
      id: c.id,
      name: c.name,
      title: c.title || c.name,
      grade: c.grade,
      subject: c.subject,
      day: c.day,
      time: c.time,
      fee: c.fee,
      description: c.description,
      location: c.location,
      teacherName: c.teacher?.name || 'Teacher',
      studentCount: c.students?.length || 0,
    }));
  }

  async getClassRoster(classId: string) {
    const cls = await this.classRepo.findOne({
      where: { id: classId },
      relations: ['students'],
    });
    if (!cls) throw new NotFoundException('Class not found');
    const roster = (cls.students || []).filter((s) => s.role === 'student');
    if (roster.length > 0) {
      return roster.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        grade: s.grade,
        paymentStatus: s.paymentStatus,
        approvalStatus: s.approvalStatus,
      }));
    }
    // Fallback by grade matching if no explicit join entries exist
    const norm = normalizeGrade(cls.grade);
    const students = await this.userRepo.find({ where: { role: 'student', approvalStatus: 'approved' } });
    return students
      .filter((s) => normalizeGrade(s.grade) === norm)
      .map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        grade: s.grade,
        paymentStatus: s.paymentStatus,
        approvalStatus: s.approvalStatus,
      }));
  }

  async createClass(
    dto: {
      name: string;
      grade: string;
      subject: string;
      day?: string;
      time?: string;
      fee?: number;
      description?: string;
      location?: string;
    },
    teacherId: string,
  ) {
    const entity = this.classRepo.create({
      id: uuid(),
      ...dto,
      title: dto.name,
      teacherId,
    });
    return this.classRepo.save(entity);
  }

  async getAnnouncements(classId?: string) {
    if (classId) {
      return this.announcementRepo.find({
        where: { classId },
        order: { createdAt: 'DESC' },
      });
    }
    return this.announcementRepo.find({ order: { createdAt: 'DESC' } });
  }

  async createAnnouncement(
    classId: string,
    title: string,
    content: string,
    teacherId: string,
  ) {
    const cls = await this.classRepo.findOne({ where: { id: classId } });
    if (!cls) throw new NotFoundException('Class not found');
    const item = this.announcementRepo.create({
      id: uuid(),
      classId,
      title,
      content,
      teacherId,
    });
    return this.announcementRepo.save(item);
  }
}

