import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Assignment } from './assignment.entity';
import { User } from './user.entity';

@Entity('submissions')
@Index(['assignmentId', 'studentId'], { unique: true })
export class Submission {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  assignmentId: string;

  @Column('text')
  studentId: string;

  @Column('text', { nullable: true })
  answerText?: string;

  @Column('text', { nullable: true })
  fileUrl?: string;

  @Column('text', { nullable: true })
  originalFileName?: string;

  @Column('text', { nullable: true })
  mimeType?: string;

  @Column('text', { default: 'submitted' })
  status: string; // 'submitted' | 'late' | 'graded'

  @Column('boolean', { default: false })
  isLate: boolean;

  @Column('text', { nullable: true })
  remarks?: string;

  @Column('integer', { nullable: true })
  marks?: number;

  @Column('text', { nullable: true })
  gradedBy?: string;

  @Column('datetime', { nullable: true })
  gradedAt?: Date;

  @CreateDateColumn()
  submittedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Assignment, (a) => a.submissions)
  assignment: Assignment;

  @ManyToOne(() => User)
  student: User;
}

