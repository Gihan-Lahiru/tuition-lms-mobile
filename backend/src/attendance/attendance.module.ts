import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AttendanceRecord,
  AttendanceSession,
} from '../database/entities/attendance.entity';
import { Class } from '../database/entities/class.entity';
import { User } from '../database/entities/user.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AttendanceSession, AttendanceRecord, Class, User]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}

