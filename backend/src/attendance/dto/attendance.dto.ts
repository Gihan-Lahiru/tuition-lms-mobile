import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttendanceSessionDto {
  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'sessionDate must be YYYY-MM-DD format',
  })
  sessionDate: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsBoolean()
  @IsOptional()
  countExcusedInDenominator?: boolean;
}

export class AttendanceRecordItemDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsIn(['present', 'absent', 'late', 'excused'])
  status: 'present' | 'absent' | 'late' | 'excused';

  @IsString()
  @IsOptional()
  note?: string;
}

export class SaveAttendanceRecordsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordItemDto)
  records: AttendanceRecordItemDto[];
}

