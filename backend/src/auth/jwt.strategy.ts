import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

export function getJwtSecret(): string {
  const configured = process.env.JWT_SECRET;
  if (configured && configured.trim().length >= 16) {
    return configured.trim();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production (>= 16 characters)');
  }
  return 'dev_only_tuition_lms_jwt_secret_key_change_in_prod';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(),
    });
  }

  async validate(payload: { sub: string; sid?: string; role: string }) {
    const user = await this.usersRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }
    if (user.currentSessionId && payload.sid && user.currentSessionId !== payload.sid) {
      throw new UnauthorizedException('Session revoked on another device. Please sign in again.');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      grade: user.grade,
      approvalStatus: user.approvalStatus,
      paymentStatus: user.paymentStatus,
      paymentDueDate: user.paymentDueDate,
      dashboardAccess: user.dashboardAccess,
    };
  }
}

