import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assignment } from '../database/entities/assignment.entity';
import { Submission } from '../database/entities/submission.entity';
import { Class } from '../database/entities/class.entity';
import { User } from '../database/entities/user.entity';
import { Notification } from '../database/entities/notification.entity';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Assignment, Submission, Class, User, Notification]),
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}

