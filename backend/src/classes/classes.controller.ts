import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class CreateClassDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() grade: string;
  @IsString() @IsNotEmpty() subject: string;
  @IsString() @IsOptional() day?: string;
  @IsString() @IsOptional() time?: string;
  @IsNumber() @IsOptional() fee?: number;
  @IsString() @IsOptional() description?: string;
  @IsString() @IsOptional() location?: string;
}

class CreateAnnouncementDto {
  @IsString() @IsNotEmpty() classId: string;
  @IsString() @IsNotEmpty() title: string;
  @IsString() @IsNotEmpty() content: string;
}

@ApiTags('Classes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  findAll() {
    return this.classesService.findAll();
  }

  @Get('my-classes')
  findMyClasses(@Req() req: any) {
    return this.classesService.findMyClasses(req.user);
  }

  @Get(':classId/roster')
  @Roles('teacher', 'admin')
  getRoster(@Param('classId') classId: string) {
    return this.classesService.getClassRoster(classId);
  }

  @Post()
  @Roles('teacher', 'admin')
  create(@Body() dto: CreateClassDto, @Req() req: any) {
    return this.classesService.createClass(dto, req.user.id);
  }

  @Get('announcements/list')
  getAnnouncements(@Query('classId') classId?: string) {
    return this.classesService.getAnnouncements(classId);
  }

  @Post('announcements')
  @Roles('teacher', 'admin')
  createAnnouncement(@Body() dto: CreateAnnouncementDto, @Req() req: any) {
    return this.classesService.createAnnouncement(
      dto.classId,
      dto.title,
      dto.content,
      req.user.id,
    );
  }
}

