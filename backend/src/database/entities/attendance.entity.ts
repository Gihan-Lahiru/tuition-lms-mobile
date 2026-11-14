import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Class } from './class.entity';
import { User } from './user.entity';

@Entity('attendance_sessions')
@Index(['classId', 'sessionDate'])
export class AttendanceSession {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  classId: string;

  @Column('text')
  sessionDate: string; // YYYY-MM-DD (Asia/Colombo)

  @Column('text', { nullable: true })
  topic?: string;

  @Column('boolean', { default: true })
  countExcusedInDenominator: boolean;

  @Column('text', { nullable: true })
  createdById?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Class)
  class: Class;

  @OneToMany(() => AttendanceRecord, (r) => r.session)
  records: AttendanceRecord[];
}

@Entity('attendance_records')
@Index(['sessionId', 'studentId'], { unique: true })
export class AttendanceRecord {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  sessionId: string;

  @Column('text')
  studentId: string;

  @Column('text', { default: 'present' })
  status: string; // 'present' | 'absent' | 'late' | 'excused'

  @Column('text', { nullable: true })
  note?: string;

  @Column('text', { nullable: true })
  markedBy?: string;

  @Column('text', { nullable: true })
  auditLog?: string; // JSON stringified array of { previousStatus, nextStatus, editedBy, editedAt }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => AttendanceSession, (s) => s.records)
  session: AttendanceSession;

  @ManyToOne(() => User)
  student: User;
}

