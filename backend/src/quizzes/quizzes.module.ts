import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Question,
  Quiz,
  QuizAnswer,
  QuizAttempt,
  QuizOption,
} from '../database/entities/quiz.entity';
import { Class } from '../database/entities/class.entity';
import { User } from '../database/entities/user.entity';
import { QuizzesService } from './quizzes.service';
import { QuizAiService } from './quiz-ai.service';
import { QuizzesController } from './quizzes.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Quiz,
      Question,
      QuizOption,
      QuizAttempt,
      QuizAnswer,
      Class,
      User,
    ]),
  ],
  controllers: [QuizzesController],
  providers: [QuizzesService, QuizAiService],
  exports: [QuizzesService, QuizAiService],
})
export class QuizzesModule {}

