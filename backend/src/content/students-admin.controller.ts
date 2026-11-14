import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Students Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher', 'admin')
@Controller('api/students')
export class StudentsAdminController {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  @Get()
  async listStudents() {
    const students = await this.userRepo.find({
      where: { role: 'student' },
      order: { createdAt: 'DESC' },
    });
    return students.map(({ password: _p, ...safe }) => safe);
  }

  @Patch(':id/approval')
  async updateApproval(
    @Param('id') id: string,
    @Body() body: { approvalStatus: 'approved' | 'rejected' | 'pending' },
  ) {
    await this.userRepo.update({ id }, { approvalStatus: body.approvalStatus });
    const updated = await this.userRepo.findOne({ where: { id } });
    if (!updated) return null;
    const { password: _p, ...safe } = updated;
    return safe;
  }
}

