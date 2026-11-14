import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('payments')
export class Payment {
  @PrimaryColumn('text')
  id: string;

  @Column('text')
  userId: string;

  @Column('text', { nullable: true })
  classId?: string;

  @Column('real')
  amount: number;

  @Column('text', { default: 'pending' })
  status: string; // 'pending' | 'completed' | 'failed'

  @Column('text', { nullable: true })
  method?: string; // 'bank_transfer' | 'receipt' | 'cash'

  @Column('text', { nullable: true })
  receiptUrl?: string;

  @Column('text', { default: 'pending' })
  approvalStatus: string; // 'pending' | 'approved' | 'rejected'

  @Column('text', { nullable: true })
  reviewNotes?: string;

  @Column('text', { nullable: true })
  month?: string;

  @Column('text', { nullable: true })
  year?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  user: User;
}

