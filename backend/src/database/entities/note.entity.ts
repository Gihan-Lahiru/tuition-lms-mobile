import { Entity, PrimaryColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Class } from './class.entity';

@Entity('notes')
export class Note {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  title: string;

  @Column('text')
  grade: string;

  @Column('text', { nullable: true })
  topic?: string;

  @Column('text', { nullable: true })
  classId?: string;

  @Column('text')
  fileUrl: string;

  @Column('text', { nullable: true })
  originalName?: string;

  @Column('text', { nullable: true })
  teacherId?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column('integer', { default: 0 })
  downloads: number;

  @ManyToOne(() => Class, (c) => c.notes, { nullable: true })
  class?: Class;
}

