import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { QuizzesService } from './quizzes.service';
import { QuizAiService } from './quiz-ai.service';
import {
  CreateQuizDto,
  GenerateQuizAiDto,
  ParseQuestionsTextDto,
  RegradeAttemptDto,
  SaveAttemptAnswersDto,
  UpdateQuizAnswerKeyDto,
  UpdateQuizSettingsDto,
} from './dto/quiz.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DashboardAccessGuard } from '../common/guards/dashboard-access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Quizzes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, DashboardAccessGuard, RolesGuard)
@Controller('api')
export class QuizzesController {
  constructor(
    private readonly quizzesService: QuizzesService,
    private readonly quizAiService: QuizAiService,
  ) { }

  @Get('quizzes')
  listQuizzes(@Req() req: any) {
    return this.quizzesService.listQuizzes(req.user);
  }

  @Post('quizzes/parse-text')
  @Roles('teacher', 'admin')
  parseQuestionsText(@Body() dto: ParseQuestionsTextDto) {
    return this.quizAiService.parseQuestionsFromText(dto.text);
  }

  @Post('quizzes/generate-ai')
  @Roles('teacher', 'admin')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 15 * 1024 * 1024 }, // up to 15MB
    }),
  )
  async generateQuizWithAi(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: GenerateQuizAiDto,
  ) {
    let text = dto.text || '';
    if (file) {
      const extracted = await this.quizAiService.extractTextFromFile(file);
      text = text ? `${text}\n\n${extracted}` : extracted;
    }
    return this.quizAiService.generateQuizWithAI({
      studyText: text,
      questionCount: dto.questionCount,
      questionType: dto.questionType,
      apiKey: dto.apiKey,
    });
  }

  @Post('quizzes')
  @Roles('teacher', 'admin')
  createQuiz(@Body() dto: CreateQuizDto, @Req() req: any) {
    return this.quizzesService.createQuiz(dto, req.user.id);
  }

  @Patch('quizzes/:id')
  @Roles('teacher', 'admin')
  updateSettings(@Param('id') id: string, @Body() dto: UpdateQuizSettingsDto) {
    return this.quizzesService.updateSettings(id, dto);
  }

  @Patch('quizzes/:id/answer-key')
  @Roles('teacher', 'admin')
  updateAnswerKey(
    @Param('id') id: string,
    @Body() dto: UpdateQuizAnswerKeyDto,
  ) {
    return this.quizzesService.updateAnswerKey(id, dto);
  }

  @Get('quizzes/:id')
  getQuiz(@Param('id') id: string, @Req() req: any) {
    return this.quizzesService.getQuizDetails(id, req.user);
  }

  @Get('quizzes/:id/attempts')
  @Roles('teacher', 'admin')
  getQuizAttempts(@Param('id') id: string) {
    return this.quizzesService.listQuizAttemptsForTeacher(id);
  }

  @Post('quizzes/:id/attempts')
  @Roles('student')
  startOrResumeAttempt(@Param('id') id: string, @Req() req: any) {
    return this.quizzesService.startOrResumeAttempt(id, req.user.id);
  }

  @Patch('quiz-attempts/:id/answers')
  @Roles('student')
  saveAnswers(
    @Param('id') attemptId: string,
    @Body() dto: SaveAttemptAnswersDto,
    @Req() req: any,
  ) {
    return this.quizzesService.saveAnswers(attemptId, req.user.id, dto);
  }

  @Post('quiz-attempts/:id/submit')
  @Roles('student')
  submitAttempt(@Param('id') attemptId: string, @Req() req: any) {
    return this.quizzesService.submitAttempt(attemptId, req.user.id);
  }

  @Get('quiz-attempts/:id/result')
  getAttemptResult(@Param('id') attemptId: string, @Req() req: any) {
    return this.quizzesService.getAttemptResult(attemptId, req.user);
  }

  @Patch('quiz-attempts/:id/regrade')
  @Roles('teacher', 'admin')
  manualRegrade(@Param('id') attemptId: string, @Body() dto: RegradeAttemptDto) {
    return this.quizzesService.manualRegrade(attemptId, dto);
  }
}

