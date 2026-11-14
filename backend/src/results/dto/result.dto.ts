import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAcademicTermDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  year: string;

  @IsString()
  @IsOptional()
  grade?: string;
}

export class UpsertResultItemDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsIn(['graded', 'absent', 'not_graded'])
  status: 'graded' | 'absent' | 'not_graded';

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  marks?: number | null;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxMarks?: number;

  @IsString()
  @IsOptional()
  remarks?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class SaveResultsDto {
  @IsString()
  @IsNotEmpty()
  termId: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpsertResultItemDto)
  results: UpsertResultItemDto[];
}

export class PublishTermResultsDto {
  @IsString()
  @IsNotEmpty()
  termId: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @IsBoolean()
  isPublished: boolean;
}

