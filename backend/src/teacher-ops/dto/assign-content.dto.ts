import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class AssignContentDto {
  @IsNotEmpty()
  @IsString()
  contentId: string;

  @IsOptional()
  @IsString()
  studentId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
