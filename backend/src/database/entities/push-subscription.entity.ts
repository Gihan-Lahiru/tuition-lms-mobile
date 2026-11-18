import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('push_subscriptions')
export class PushSubscription {
  @PrimaryColumn('text')
  id: string;

  @Index()
  @Column('text')
  userId: string;

  @Index({ unique: true })
  @Column('text')
  endpoint: string;

  @Column('text')
  p256dh: string;

  @Column('text')
  auth: string;

  @Column('text', { nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
