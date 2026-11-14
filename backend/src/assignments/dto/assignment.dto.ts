import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAssignmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  dueDate?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  maxMarks?: number;

  @IsBoolean()
  @IsOptional()
  allowLateSubmission?: boolean;
}

export class SubmitAssignmentDto {
  @IsString()
  @IsOptional()
  answerText?: string;
}

export class GradeSubmissionDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  marks: number;

  @IsString()
  @IsOptional()
  remarks?: string;
}

