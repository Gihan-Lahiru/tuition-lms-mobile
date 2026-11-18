import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { ResultsModule } from './results/results.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ContentModule } from './content/content.module';
import { StudentsAdminController } from './content/students-admin.controller';
import { SeedService } from './common/services/seed.service';
import { PdfWatermarkService } from './common/services/pdf-watermark.service';
import { InitLmsSchema1731400000000 } from './database/migrations/1731400000000-InitLmsSchema';
import { AddMultipleChoiceQuizSupport1731450000000 } from './database/migrations/1731450000000-AddMultipleChoiceQuizSupport';

import { User } from './database/entities/user.entity';
import { Class } from './database/entities/class.entity';
import { Assignment } from './database/entities/assignment.entity';
import { Submission } from './database/entities/submission.entity';
import { Paper } from './database/entities/paper.entity';
import { Note } from './database/entities/note.entity';
import { Video } from './database/entities/video.entity';
import { Payment } from './database/entities/payment.entity';
import { Notification } from './database/entities/notification.entity';
import { Announcement } from './database/entities/announcement.entity';
import {
  Question,
  Quiz,
  QuizAnswer,
  QuizAttempt,
  QuizOption,
} from './database/entities/quiz.entity';
import { AcademicTerm, ExamResult } from './database/entities/result.entity';
import {
  AttendanceRecord,
  AttendanceSession,
} from './database/entities/attendance.entity';
import { Message } from './database/entities/message.entity';

const ALL_ENTITIES = [
  User,
  Class,
  Assignment,
  Submission,
  Paper,
  Note,
  Video,
  Payment,
  Notification,
  Announcement,
  Message,
  Quiz,
  Question,
  QuizOption,
  QuizAttempt,
  QuizAnswer,
  AcademicTerm,
  ExamResult,
  AttendanceSession,
  AttendanceRecord,
];

const ALL_MIGRATIONS = [
  InitLmsSchema1731400000000,
  AddMultipleChoiceQuizSupport1731450000000,
];

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const dbType = process.env.DB_TYPE || 'better-sqlite3';
        if (dbType === 'mysql') {
          return {
            type: 'mysql',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306', 10),
            username: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'tuition_lms',
            entities: ALL_ENTITIES,
            migrations: ALL_MIGRATIONS,
            migrationsRun: process.env.DB_MIGRATIONS_RUN !== 'false',
            synchronize: false,
          };
        }

        return {
          type: 'better-sqlite3',
          database: process.env.DB_SQLITE_PATH || './lms_tuition.db',
          entities: ALL_ENTITIES,
          migrations: ALL_MIGRATIONS,
          migrationsRun: process.env.DB_MIGRATIONS_RUN !== 'false',
          synchronize: false,
        };
      },
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
    AuthModule,
    ClassesModule,
    AssignmentsModule,
    QuizzesModule,
    ResultsModule,
    AttendanceModule,
    ContentModule,
  ],
  controllers: [StudentsAdminController],
  providers: [SeedService, PdfWatermarkService],
})
export class AppModule {}

