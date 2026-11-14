import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('videos')
export class Video {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  description?: string;

  @Column('text')
  videoUrl: string;

  @Column('text')
  grade: string;

  @Column('text', { nullable: true })
  topic?: string;

  @Column('text', { nullable: true })
  duration?: string;

  @Column('text', { nullable: true })
  classId?: string;

  @Column('text', { nullable: true })
  teacherId?: string;

  @CreateDateColumn()
  createdAt: Date;
}

