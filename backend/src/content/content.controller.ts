import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { memoryStorage } from 'multer';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { Paper } from '../database/entities/paper.entity';
import { Note } from '../database/entities/note.entity';
import { User } from '../database/entities/user.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardAccessGuard } from '../common/guards/dashboard-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PdfWatermarkService } from '../common/services/pdf-watermark.service';
import { normalizeGrade } from '../common/utils/grade.util';
import {
  ensureUploadSubdir,
  sanitizeFilename,
  validateUploadedFile,
} from '../common/utils/file-validation.util';

@ApiTags('Papers & Notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, DashboardAccessGuard, RolesGuard)
@Controller('api')
export class ContentController {
  constructor(
    @InjectRepository(Paper) private readonly paperRepo: Repository<Paper>,
    @InjectRepository(Note) private readonly noteRepo: Repository<Note>,
    private readonly watermarkService: PdfWatermarkService,
  ) {}

  @Get('papers')
  async listPapers(@Req() req: any, @Query('grade') grade?: string) {
    const all = await this.paperRepo.find({ order: { createdAt: 'DESC' } });
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      return grade
        ? all.filter((p) => normalizeGrade(p.grade) === normalizeGrade(grade))
        : all;
    }
    const targetGrade = normalizeGrade(grade || req.user.grade);
    return targetGrade
      ? all.filter((p) => normalizeGrade(p.grade) === targetGrade)
      : all;
  }

  @Post('papers/upload')
  @Roles('teacher', 'admin')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadPaper(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      title?: string;
      grade?: string;
      type?: string;
      topic?: string;
      year?: string;
      classId?: string;
    },
    @Req() req: any,
  ) {
    validateUploadedFile(file, ['application/pdf']);
    if (!body.title?.trim() || !body.grade?.trim()) {
      throw new BadRequestException('Title and grade are required');
    }
    const dir = ensureUploadSubdir('papers');
    const filename = `${uuid()}_${sanitizeFilename(file.originalname)}`;
    fs.writeFileSync(path.join(dir, filename), file.buffer);

    const paper = this.paperRepo.create({
      id: uuid(),
      title: body.title.trim(),
      grade: body.grade.trim(),
      type: body.type?.trim() || 'Past Paper',
      topic: body.topic?.trim(),
      year: body.year?.trim(),
      classId: body.classId,
      fileUrl: `/uploads/papers/${filename}`,
      originalName: file.originalname,
      teacherId: req.user.id,
      downloads: 0,
    });
    return this.paperRepo.save(paper);
  }

  @Get('papers/:id/download')
  async downloadPaper(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
    @Query('inline') inline?: string,
  ) {
    const paper = await this.paperRepo.findOne({ where: { id } });
    if (!paper) throw new NotFoundException('Paper not found');

    const buf = await this.watermarkService.resolveAndWatermarkLocalOrRemote(
      paper.fileUrl,
      req.user.name,
      normalizeGrade(req.user.grade) || normalizeGrade(paper.grade),
    );
    if (!buf) throw new NotFoundException('Paper PDF file not found on storage');

    paper.downloads += 1;
    await this.paperRepo.save(paper);

    const safeTitle = sanitizeFilename(paper.title) || 'paper';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader(
      'Content-Disposition',
      `${inline === 'true' ? 'inline' : 'attachment'}; filename="${safeTitle}.pdf"`,
    );
    res.setHeader('Content-Length', buf.length);
    return res.send(buf);
  }

  @Delete('papers/:id')
  @Roles('teacher', 'admin')
  async deletePaper(@Param('id') id: string) {
    await this.paperRepo.delete({ id });
    return { deleted: true };
  }

  @Get('notes')
  async listNotes(@Req() req: any, @Query('grade') grade?: string) {
    const all = await this.noteRepo.find({ order: { createdAt: 'DESC' } });
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      return grade
        ? all.filter((n) => normalizeGrade(n.grade) === normalizeGrade(grade))
        : all;
    }
    const targetGrade = normalizeGrade(grade || req.user.grade);
    return targetGrade
      ? all.filter((n) => normalizeGrade(n.grade) === targetGrade)
      : all;
  }

  @Post('notes/upload')
  @Roles('teacher', 'admin')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadNote(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      title?: string;
      grade?: string;
      topic?: string;
      classId?: string;
    },
    @Req() req: any,
  ) {
    validateUploadedFile(file, ['application/pdf']);
    if (!body.title?.trim() || !body.grade?.trim()) {
      throw new BadRequestException('Title and grade are required');
    }
    const dir = ensureUploadSubdir('notes');
    const filename = `${uuid()}_${sanitizeFilename(file.originalname)}`;
    fs.writeFileSync(path.join(dir, filename), file.buffer);

    const note = this.noteRepo.create({
      id: uuid(),
      title: body.title.trim(),
      grade: body.grade.trim(),
      topic: body.topic?.trim(),
      classId: body.classId,
      fileUrl: `/uploads/notes/${filename}`,
      originalName: file.originalname,
      teacherId: req.user.id,
      downloads: 0,
    });
    return this.noteRepo.save(note);
  }

  @Get('notes/:id/download')
  async downloadNote(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
    @Query('inline') inline?: string,
  ) {
    const note = await this.noteRepo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Note not found');

    const buf = await this.watermarkService.resolveAndWatermarkLocalOrRemote(
      note.fileUrl,
      req.user.name,
      normalizeGrade(req.user.grade) || normalizeGrade(note.grade),
    );
    if (!buf) throw new NotFoundException('Note PDF file not found on storage');

    note.downloads += 1;
    await this.noteRepo.save(note);

    const safeTitle = sanitizeFilename(note.title) || 'note';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader(
      'Content-Disposition',
      `${inline === 'true' ? 'inline' : 'attachment'}; filename="${safeTitle}.pdf"`,
    );
    res.setHeader('Content-Length', buf.length);
    return res.send(buf);
  }
}

