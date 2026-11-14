import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { AssignmentsService } from './assignments.service';
import {
  CreateAssignmentDto,
  GradeSubmissionDto,
  SubmitAssignmentDto,
} from './dto/assignment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardAccessGuard } from '../common/guards/dashboard-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Assignments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, DashboardAccessGuard, RolesGuard)
@Controller('api')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Get('assignments/my-assignments')
  findMyAssignments(@Req() req: any) {
    return this.assignmentsService.findMyAssignments(req.user);
  }

  @Get('assignments/class/:classId')
  findByClass(@Param('classId') classId: string) {
    return this.assignmentsService.findByClass(classId);
  }

  @Post('assignments/:classId')
  @Roles('teacher', 'admin')
  create(
    @Param('classId') classId: string,
    @Body() dto: CreateAssignmentDto,
    @Req() req: any,
  ) {
    return this.assignmentsService.create(classId, dto, req.user.id);
  }

  @Post('assignments/:id/submissions')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  submit(
    @Param('id') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    return this.assignmentsService.submit(assignmentId, req.user.id, dto, file);
  }

  @Get('assignments/:id/submissions')
  @Roles('teacher', 'admin')
  getSubmissions(@Param('id') assignmentId: string) {
    return this.assignmentsService.getSubmissionsByAssignment(assignmentId);
  }

  @Patch('submissions/:id/grade')
  @Roles('teacher', 'admin')
  gradePatch(
    @Param('id') submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @Req() req: any,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, dto, req.user.id);
  }

  @Put('submissions/:id/grade')
  @Roles('teacher', 'admin')
  gradePut(
    @Param('id') submissionId: string,
    @Body() dto: GradeSubmissionDto,
    @Req() req: any,
  ) {
    return this.assignmentsService.gradeSubmission(submissionId, dto, req.user.id);
  }

  @Get('submissions/:id/file')
  async downloadSubmissionFile(
    @Param('id') submissionId: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const info = await this.assignmentsService.getProtectedSubmissionFile(
      submissionId,
      req.user,
    );
    res.setHeader('Content-Type', info.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(info.fileName)}"`,
    );
    return res.sendFile(info.absPath);
  }
}

