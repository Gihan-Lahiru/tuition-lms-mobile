import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';

/**
 * Enforces student approval and the 14-day payment grace lock server-side.
 * Teachers and admins bypass payment grace lock checks.
 */
@Injectable()
export class DashboardAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const jwtUser = request.user;

    if (!jwtUser) return true;
    if (jwtUser.role !== 'student') return true;

    const user = await this.usersRepo.findOne({ where: { id: jwtUser.id } });
    if (!user) {
      throw new ForbiddenException('Student account not found');
    }

    if (user.approvalStatus !== 'approved') {
      throw new ForbiddenException({
        code: 'APPROVAL_PENDING',
        message: 'Your registration is awaiting teacher approval.',
        approvalStatus: user.approvalStatus,
      });
    }

    if (user.status && user.status !== 'active') {
      throw new ForbiddenException('Account is inactive or suspended.');
    }

    if (!user.dashboardAccess) {
      throw new ForbiddenException({
        code: 'PAYMENT_LOCKED',
        message: 'Payment overdue. Access restricted.',
        paymentStatus: user.paymentStatus,
      });
    }

    if (user.paymentDueDate && user.paymentStatus !== 'paid') {
      const now = new Date();
      const dueDate = new Date(user.paymentDueDate);
      if (now > dueDate) {
        throw new ForbiddenException({
          code: 'PAYMENT_LOCKED',
          message: '14-day payment grace period expired. Please upload your fee receipt.',
          paymentStatus: user.paymentStatus,
          paymentDueDate: user.paymentDueDate,
        });
      }
    }

    return true;
  }
}

