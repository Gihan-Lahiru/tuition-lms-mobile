import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { User } from '../database/entities/user.entity';
import { ChangePasswordDto, LoginDto, RegisterDto } from './dto/auth.dto';
import { normalizeGrade } from '../common/utils/grade.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  sanitizeUser(user: User) {
    const { password: _pwd, ...safe } = user;
    const now = new Date();
    const graceExpired =
      safe.role === 'student' &&
      (!safe.dashboardAccess ||
        (safe.paymentDueDate &&
          safe.paymentStatus !== 'paid' &&
          now > new Date(safe.paymentDueDate)));

    return {
      ...safe,
      isGraceLocked: Boolean(graceExpired),
      normalizedGrade: normalizeGrade(safe.grade),
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionId = uuid();
    user.currentSessionId = sessionId;
    await this.usersRepo.save(user);

    const token = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      sid: sessionId,
    });

    return {
      access_token: token,
      token,
      user: this.sanitizeUser(user),
    };
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepo.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // Standard 14-day grace period

    const user = this.usersRepo.create({
      id: uuid(),
      email,
      name: dto.name.trim(),
      password: hashedPassword,
      role: 'student',
      grade: dto.grade || 'Grade 10',
      phone: dto.phone,
      tuitionClass: dto.tuitionClass,
      emailVerified: true,
      approvalStatus: 'pending',
      status: 'active',
      paymentStatus: 'unpaid',
      paymentDueDate: dueDate,
      dashboardAccess: true,
    });

    await this.usersRepo.save(user);

    const sessionId = uuid();
    user.currentSessionId = sessionId;
    await this.usersRepo.save(user);

    const token = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
      sid: sessionId,
    });

    return {
      message: 'Registration successful. Awaiting teacher approval.',
      access_token: token,
      token,
      user: this.sanitizeUser(user),
    };
  }

  async getMe(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async logout(userId: string) {
    await this.usersRepo.update({ id: userId }, { currentSessionId: null });
    return { message: 'Signed out from active session' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const valid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!valid) {
      throw new BadRequestException('Current password is incorrect');
    }
    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.currentSessionId = uuid();
    await this.usersRepo.save(user);
    return { message: 'Password updated successfully' };
  }

  async updateProfile(
    userId: string,
    data: { name?: string; phone?: string; institute?: string; grade?: string },
  ) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (data.name) user.name = data.name.trim();
    if (data.phone !== undefined) user.phone = data.phone.trim();
    if (data.institute !== undefined) user.institute = data.institute.trim();
    if (data.grade !== undefined) user.grade = data.grade.trim();
    await this.usersRepo.save(user);
    return this.sanitizeUser(user);
  }
}

