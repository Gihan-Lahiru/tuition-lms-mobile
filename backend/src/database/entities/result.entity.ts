import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Class } from './class.entity';
import { User } from './user.entity';

@Entity('academic_terms')
export class AcademicTerm {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  name: string; // e.g., "Term 1 - 2026"

  @Column('text')
  year: string;

  @Column('text', { nullable: true })
  grade?: string;

  @Column('boolean', { default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('exam_results')
@Index(['termId', 'studentId', 'classId'], { unique: true })
export class ExamResult {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  termId: string;

  @Column('text')
  classId: string;

  @Column('text')
  studentId: string;

  @Column('real', { nullable: true })
  marks?: number | null; // null when absent or not_graded

  @Column('real', { default: 100 })
  maxMarks: number;

  @Column('text', { default: 'not_graded' })
  status: string; // 'graded' | 'absent' | 'not_graded'

  @Column('text', { nullable: true })
  gradeLetter?: string | null;

  @Column('text', { nullable: true })
  remarks?: string;

  @Column('boolean', { default: false })
  isPublished: boolean;

  @Column('text', { nullable: true })
  updatedBy?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => AcademicTerm)
  term: AcademicTerm;

  @ManyToOne(() => Class)
  class: Class;

  @ManyToOne(() => User)
  student: User;
}

