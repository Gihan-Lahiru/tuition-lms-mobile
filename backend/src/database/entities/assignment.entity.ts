import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Class } from './class.entity';
import { Submission } from './submission.entity';
import { User } from './user.entity';

@Entity('assignments')
export class Assignment {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  classId: string;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('datetime', { nullable: true })
  dueDate?: Date;

  @Column('integer', { default: 100 })
  maxMarks: number;

  @Column('boolean', { default: true })
  allowLateSubmission: boolean;

  @Column('text', { nullable: true })
  attachmentUrl?: string;

  @Column('text', { nullable: true })
  createdById?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Class, (c) => c.assignments)
  class: Class;

  @OneToMany(() => Submission, (s) => s.assignment)
  submissions: Submission[];

  @ManyToOne(() => User, (u) => u.assignments)
  createdBy: User;
}

