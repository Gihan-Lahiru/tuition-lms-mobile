import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @Column('text')
  title: string;

  @Column('text')
  message: string;

  @Column('text', { default: 'info' })
  type: string; // 'info' | 'quiz' | 'assignment' | 'result' | 'payment' | 'attendance'

  @Column('boolean', { default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;
}

