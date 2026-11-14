import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuizOptionDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsIn(['single_choice', 'multiple_choice'])
  @IsOptional()
  questionType?: 'single_choice' | 'multiple_choice';

  @IsString()
  @IsOptional()
  explanation?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  marks?: number;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizOptionDto)
  options: CreateQuizOptionDto[];
}

export class CreateQuizDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  classId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(240)
  durationMinutes: number;

  @IsString()
  @IsOptional()
  opensAt?: string;

  @IsString()
  @IsOptional()
  closesAt?: string;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @IsBoolean()
  @IsOptional()
  releaseAnswersAfterSubmit?: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxAttempts?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}

export class UpdateQuizSettingsDto {
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  releaseAnswersAfterSubmit?: boolean;
}

export class SaveAnswersItemDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsString()
  @IsOptional()
  selectedOptionId?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  selectedOptionIds?: string[];
}

export class UpdateQuestionKeyItemDto {
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @IsIn(['single_choice', 'multiple_choice'])
  @IsOptional()
  questionType?: 'single_choice' | 'multiple_choice';

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  correctOptionIds: string[];
}

export class UpdateQuizAnswerKeyDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionKeyItemDto)
  questions: UpdateQuestionKeyItemDto[];
}

export class SaveAttemptAnswersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaveAnswersItemDto)
  answers: SaveAnswersItemDto[];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  tabSwitchCount?: number;
}

export class RegradeAttemptDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  score: number;
}

export class ParseQuestionsTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class GenerateQuizAiDto {
  @IsString()
  @IsOptional()
  text?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  questionCount?: number;

  @IsIn(['single_choice', 'multiple_choice', 'mixed'])
  @IsOptional()
  questionType?: 'single_choice' | 'multiple_choice' | 'mixed';

  @IsString()
  @IsOptional()
  apiKey?: string;
}


