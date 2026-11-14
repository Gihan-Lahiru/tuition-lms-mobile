import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { Video } from '../database/entities/video.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardAccessGuard } from '../common/guards/dashboard-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { normalizeGrade } from '../common/utils/grade.util';

class CreateVideoDto {
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() videoUrl: string;
  @IsString() @IsNotEmpty() grade: string;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() topic?: string;
  @IsString() @IsOptional() duration?: string;
  @IsString() @IsOptional() classId?: string;
}

@ApiTags('Videos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, DashboardAccessGuard, RolesGuard)
@Controller('api/videos')
export class VideosController {
  constructor(
    @InjectRepository(Video) private readonly videoRepo: Repository<Video>,
  ) {}

  @Get()
  async list(@Req() req: any, @Query('grade') grade?: string) {
    const all = await this.videoRepo.find({ order: { createdAt: 'DESC' } });
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      return grade
        ? all.filter((v) => normalizeGrade(v.grade) === normalizeGrade(grade))
        : all;
    }
    const targetGrade = normalizeGrade(grade || req.user.grade);
    return targetGrade
      ? all.filter((v) => normalizeGrade(v.grade) === targetGrade)
      : all;
  }

  @Post()
  @Roles('teacher', 'admin')
  create(@Body() dto: CreateVideoDto, @Req() req: any) {
    const video = this.videoRepo.create({
      id: uuid(),
      ...dto,
      teacherId: req.user.id,
    });
    return this.videoRepo.save(video);
  }

  @Delete(':id')
  @Roles('teacher', 'admin')
  async remove(@Param('id') id: string) {
    await this.videoRepo.delete({ id });
    return { deleted: true };
  }
}

