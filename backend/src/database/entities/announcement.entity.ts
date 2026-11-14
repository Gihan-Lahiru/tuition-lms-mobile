import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('announcements')
export class Announcement {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  classId: string;

  @Column('text')
  title: string;

  @Column('text')
  content: string;

  @Column('text', { nullable: true })
  teacherId?: string;

  @CreateDateColumn()
  createdAt: Date;
}

