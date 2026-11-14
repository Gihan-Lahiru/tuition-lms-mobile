import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceSessionDto,
  SaveAttendanceRecordsDto,
} from './dto/attendance.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardAccessGuard } from '../common/guards/dashboard-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, DashboardAccessGuard, RolesGuard)
@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('sessions')
  @Roles('teacher', 'admin')
  createSession(@Body() dto: CreateAttendanceSessionDto, @Req() req: any) {
    return this.attendanceService.createSession(dto, req.user.id);
  }

  @Get('sessions/class/:classId')
  @Roles('teacher', 'admin')
  getClassSessions(@Param('classId') classId: string) {
    return this.attendanceService.getClassSessions(classId);
  }

  @Put('sessions/:id/records')
  @Roles('teacher', 'admin')
  saveRecords(
    @Param('id') sessionId: string,
    @Body() dto: SaveAttendanceRecordsDto,
    @Req() req: any,
  ) {
    return this.attendanceService.saveSessionRecords(sessionId, dto, req.user.id);
  }

  @Get('me')
  @Roles('student')
  getMyAttendance(@Req() req: any, @Query('month') month?: string) {
    return this.attendanceService.getMyAttendance(req.user.id, month);
  }
}

