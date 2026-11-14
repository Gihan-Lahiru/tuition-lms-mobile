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

@Entity('quizzes')
export class Quiz {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text')
  classId: string;

  @Column('text')
  grade: string;

  @Column('integer', { default: 15 })
  durationMinutes: number;

  @Column('datetime', { nullable: true })
  opensAt?: Date;

  @Column('datetime', { nullable: true })
  closesAt?: Date;

  @Column('boolean', { default: false })
  isPublished: boolean;

  @Column('boolean', { default: false })
  shuffleQuestions: boolean;

  @Column('boolean', { default: true })
  releaseAnswersAfterSubmit: boolean;

  @Column('integer', { default: 1 })
  maxAttempts: number;

  @Column('text', { nullable: true })
  createdById?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Class)
  class: Class;

  @OneToMany(() => Question, (q) => q.quiz)
  questions: Question[];
}

@Entity('questions')
export class Question {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  quizId: string;

  @Column('text')
  prompt: string;

  @Column('text', { default: 'single_choice' })
  questionType: string; // 'single_choice' | 'multiple_choice'

  @Column('text', { nullable: true })
  explanation?: string;

  @Column('integer', { default: 1 })
  marks: number;

  @Column('integer', { default: 0 })
  orderIndex: number;

  @ManyToOne(() => Quiz, (q) => q.questions)
  quiz: Quiz;

  @OneToMany(() => QuizOption, (o) => o.question)
  options: QuizOption[];
}

@Entity('quiz_options')
export class QuizOption {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  questionId: string;

  @Column('text')
  label: string;

  @Column('boolean', { default: false })
  isCorrect: boolean;

  @Column('integer', { default: 0 })
  orderIndex: number;

  @ManyToOne(() => Question, (q) => q.options)
  question: Question;
}

@Entity('quiz_attempts')
@Index(['quizId', 'studentId'])
export class QuizAttempt {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  quizId: string;

  @Column('text')
  studentId: string;

  @Column('text', { default: 'in_progress' })
  status: string; // 'in_progress' | 'submitted' | 'auto_submitted' | 'regraded'

  @Column('integer', { nullable: true })
  randomSeed?: number;

  @Column('datetime')
  startedAt: Date;

  @Column('datetime')
  expiresAt: Date;

  @Column('datetime', { nullable: true })
  submittedAt?: Date;

  @Column('integer', { default: 0 })
  score: number;

  @Column('integer', { default: 0 })
  maxScore: number;

  @Column('real', { default: 0 })
  percentage: number;

  @Column('integer', { default: 0 })
  tabSwitchCount: number;

  @ManyToOne(() => Quiz)
  quiz: Quiz;

  @ManyToOne(() => User)
  student: User;

  @OneToMany(() => QuizAnswer, (a) => a.attempt)
  answers: QuizAnswer[];
}

@Entity('quiz_answers')
@Index(['attemptId', 'questionId'], { unique: true })
export class QuizAnswer {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  attemptId: string;

  @Column('text')
  questionId: string;

  @Column('text', { nullable: true })
  selectedOptionId?: string;

  @Column('text', { nullable: true })
  selectedOptionIds?: string | null; // JSON array of selected option IDs

  @Column('boolean', { nullable: true })
  isCorrect?: boolean;

  @Column('integer', { default: 0 })
  awardedMarks: number;

  @UpdateDateColumn()
  savedAt: Date;

  @ManyToOne(() => QuizAttempt, (a) => a.answers)
  attempt: QuizAttempt;
}

