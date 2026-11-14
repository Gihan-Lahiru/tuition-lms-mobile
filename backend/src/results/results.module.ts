import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AcademicTerm, ExamResult } from '../database/entities/result.entity';
import { Class } from '../database/entities/class.entity';
import { Assignment } from '../database/entities/assignment.entity';
import { Submission } from '../database/entities/submission.entity';
import { QuizAttempt } from '../database/entities/quiz.entity';
import { User } from '../database/entities/user.entity';
import { ResultsService } from './results.service';
import { ResultsController } from './results.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AcademicTerm,
      ExamResult,
      Class,
      Assignment,
      Submission,
      QuizAttempt,
      User,
    ]),
  ],
  controllers: [ResultsController],
  providers: [ResultsService],
  exports: [ResultsService],
})
export class ResultsModule {}

